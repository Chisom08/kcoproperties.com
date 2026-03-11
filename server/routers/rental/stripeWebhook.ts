import express, { Express, Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../../db";
import { rentalApplications as applications } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendApplicationReceipt, sendAdminPaymentNotification } from "../../emailService";

const APPLICATION_FEE_CENTS = 5000; // $50.00

export function registerStripeWebhook(app: Express) {
  // MUST use express.raw() BEFORE express.json() for webhook signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const stripeKey = process.env.STRIPE_SECRET_KEY;

      if (!stripeKey) {
        console.error("[Stripe Webhook] STRIPE_SECRET_KEY not configured");
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const stripe = new Stripe(stripeKey);
      const sig = req.headers["stripe-signature"] as string;

      let event: Stripe.Event | undefined;

      try {
        if (webhookSecret && sig) {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
          // In development without webhook secret, parse the body directly
          const body = req.body?.toString?.();
          if (!body) {
            return res.status(400).json({ error: "Empty webhook body" });
          }
          event = JSON.parse(body) as Stripe.Event;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
        return res.status(400).json({ error: `Webhook Error: ${message}` });
      }

      // Guard: if event is undefined or malformed, reject gracefully
      if (!event || !event.id) {
        console.error("[Stripe Webhook] Received malformed or empty event");
        return res.status(400).json({ error: "Malformed event" });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event received: ${event.type} (${event.id})`);

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;

          if (session.payment_status === "paid" && session.client_reference_id) {
            const applicationId = parseInt(session.client_reference_id, 10);

            if (!isNaN(applicationId)) {
              const db = await getDb();
              if (db) {
                await db
                  .update(applications)
                  .set({
                    paymentStatus: "paid",
                    stripePaymentIntentId:
                      typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : session.payment_intent?.id || null,
                    stripeCheckoutSessionId: session.id,
                    paymentAmount: APPLICATION_FEE_CENTS,
                  })
                  .where(eq(applications.id, applicationId));
                console.log(
                  `[Stripe Webhook] Payment confirmed for application ${applicationId}`
                );
                // Fetch applicant details and send payment confirmation email
                try {
                  const appRows = await db
                    .select({
                      firstName: applications.firstName,
                      lastName: applications.lastName,
                      email: applications.email,
                      propertyAddress: applications.propertyAddress,
                      status: applications.status,
                    })
                    .from(applications)
                    .where(eq(applications.id, applicationId))
                    .limit(1);
                  if (appRows.length > 0 && appRows[0].email) {
                    const appRow = appRows[0];
                    const applicantEmail = appRow.email as string;
                    const applicantName =
                      `${appRow.firstName || ""} ${appRow.lastName || ""}`.trim() ||
                      applicantEmail;
                    const paymentIntentId =
                      typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : session.payment_intent?.id || null;

                    // Send applicant receipt (only if not yet submitted —
                    // the submit handler sends the full receipt on submission)
                    if (appRow.status !== "submitted") {
                      await sendApplicationReceipt({
                        applicationId,
                        applicantName,
                        applicantEmail,
                        propertyAddress: appRow.propertyAddress,
                        submittedAt: new Date(),
                        paymentStatus: "paid",
                        paymentAmount: APPLICATION_FEE_CENTS,
                        stripePaymentIntentId: paymentIntentId,
                      });
                    }

                    // Always notify the admin inbox of every successful payment
                    await sendAdminPaymentNotification({
                      applicationId,
                      applicantName,
                      applicantEmail,
                      propertyAddress: appRow.propertyAddress,
                      paymentAmount: APPLICATION_FEE_CENTS,
                      stripePaymentIntentId: paymentIntentId,
                      stripeCheckoutSessionId: session.id,
                      paidAt: new Date(),
                    });
                  }
                } catch (emailErr) {
                  console.error("[Stripe Webhook] Failed to send payment email:", emailErr);
                }
              }
            }
          }
        }

        if (event.type === "payment_intent.succeeded") {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Stripe Webhook] PaymentIntent succeeded: ${paymentIntent.id}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error processing event:", err);
        // Return 200 to prevent Stripe from retrying
      }

      return res.json({ received: true });
    }
  );
}
