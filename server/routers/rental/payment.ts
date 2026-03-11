import { z } from "zod";
import { publicProcedure, router } from "../../_core/trpc";
import { getDb } from "../../db";
import { rentalApplications as applications } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const APPLICATION_FEE_CENTS = 5000; // $50.00

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe secret key not configured");
  return new Stripe(key);
}

export const paymentRouter = router({
  // Create a Stripe Checkout Session for the application fee
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        applicationId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Fetch the application to get applicant email/name
      const apps = await db
        .select({
          id: applications.id,
          email: applications.email,
          firstName: applications.firstName,
          lastName: applications.lastName,
          paymentStatus: applications.paymentStatus,
          stripeCheckoutSessionId: applications.stripeCheckoutSessionId,
        })
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (apps.length === 0) throw new Error("Application not found");
      const app = apps[0];

      // If already paid, return success immediately
      if (app.paymentStatus === "paid") {
        return { alreadyPaid: true, url: null };
      }

      const stripe = getStripe();
      // Get origin from headers, or construct from request
      const origin = (ctx.req.headers.origin as string) || 
                     (ctx.req.headers.host ? `http://${ctx.req.headers.host}` : "http://localhost:3002");

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "KCO Properties — Application & Background Check Fee",
                description:
                  "Non-refundable application processing fee including TransUnion background check",
              },
              unit_amount: APPLICATION_FEE_CENTS,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: app.email || undefined,
        client_reference_id: input.applicationId.toString(),
        metadata: {
          applicationId: input.applicationId.toString(),
          applicantName: `${app.firstName || ""} ${app.lastName || ""}`.trim(),
          applicantEmail: app.email || "",
        },
        success_url: `${origin}/rental/apply/agreement?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/rental/apply/agreement?payment=cancelled`,
        allow_promotion_codes: false,
      });

      // Store the checkout session ID in the application
      await db
        .update(applications)
        .set({ stripeCheckoutSessionId: session.id })
        .where(eq(applications.id, input.applicationId));

      return { alreadyPaid: false, url: session.url };
    }),

  // Verify payment status for a given application
  getPaymentStatus: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const apps = await db
        .select({
          paymentStatus: applications.paymentStatus,
          stripePaymentIntentId: applications.stripePaymentIntentId,
          paymentAmount: applications.paymentAmount,
        })
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (apps.length === 0) throw new Error("Application not found");
      return apps[0];
    }),

  // Manually verify a completed checkout session (called after redirect back)
  verifyCheckoutSession: publicProcedure
    .input(
      z.object({
        applicationId: z.number(),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const stripe = getStripe();

      const session = await stripe.checkout.sessions.retrieve(input.sessionId);

      if (
        session.payment_status === "paid" &&
        session.client_reference_id === input.applicationId.toString()
      ) {
        await db
          .update(applications)
          .set({
            paymentStatus: "paid",
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || null,
            paymentAmount: APPLICATION_FEE_CENTS,
          })
          .where(eq(applications.id, input.applicationId));

        return { paid: true };
      }

      return { paid: false };
    }),
});
