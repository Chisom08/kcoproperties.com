import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../../_core/trpc";
import { getDb } from "../../db";
import { rentalApplications as applications, coApplicants, vehicles } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "../../_core/notification";
import { sendApplicationReceipt, sendRentalApplicationPdfToStaff } from "../../emailService";
import { generateRentalApplicationPDF, type RentalApplicationPDFData } from "../../rentalPdfGenerator";
import bcrypt from "bcryptjs";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const applicationRouter = router({
  // Register a new applicant and create a draft application
  register: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
        email: z.string().email(),
        password: z
          .string()
          .min(10)
          .regex(/\d/, "Password must contain at least one number"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const existing = await db
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new Error(
          "An application with this email already exists. Please log in."
        );
      }

      const hash = await hashPassword(input.password);
      const nameParts = input.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const result = await db.insert(applications).values({
        email: input.email,
        firstName,
        lastName,
        passwordHash: hash,
        currentStep: 3,
        status: "draft",
      });

      const appId = (result as unknown as [{ insertId: number }, unknown])[0].insertId;

      return { applicationId: appId, currentStep: 3 };
    }),

  // Login to resume an existing application
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const apps = await db
        .select()
        .from(applications)
        .where(eq(applications.email, input.email))
        .limit(1);

      if (apps.length === 0) {
        throw new Error("No application found with this email.");
      }

      const app = apps[0];
      const storedHash = app.passwordHash;

      if (!storedHash) {
        throw new Error("Invalid account. Please sign up.");
      }

      const valid = await verifyPassword(input.password, storedHash);

      if (!valid) {
        throw new Error("Incorrect password. Please try again.");
      }

      return { applicationId: app.id, currentStep: app.currentStep || 3 };
    }),

  // Get application by ID
  getApplication: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const apps = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (apps.length === 0) return null;

      const app = apps[0];
      return {
        ...app,
        signatureName: app.signatureName?.startsWith("__pwdhash__")
          ? null
          : app.signatureName,
      };
    }),

  // Get co-applicants for an application
  getCoApplicants: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const coApps = await db
        .select()
        .from(coApplicants)
        .where(eq(coApplicants.applicationId, input.applicationId));

      return coApps;
    }),

  // Get vehicles for an application
  getVehicles: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const vehs = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.applicationId, input.applicationId));

      return vehs;
    }),

  // Save application draft (auto-save)
  saveDraft: publicProcedure
    .input(
      z.object({
        applicationId: z.number(),
        step: z.number(),
        data: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updateData: Record<string, unknown> = {
        currentStep: input.step,
      };

      const d = input.data;
      // Convert empty strings to null for all fields (MySQL rejects empty strings for ENUM/constrained columns)
      const s = (v: unknown): string | null => {
        if (typeof v !== "string") return null;
        return v.trim() === "" ? null : v;
      };
      // For enum fields: empty string must become null
      const sEnum = <T extends string>(v: unknown, valid: T[]): T | null => {
        if (typeof v !== "string" || v.trim() === "") return null;
        return valid.includes(v as T) ? (v as T) : null;
      };

      if (d.propertyAddress !== undefined) updateData.propertyAddress = s(d.propertyAddress);
      if (d.firstName !== undefined) updateData.firstName = s(d.firstName);
      if (d.lastName !== undefined) updateData.lastName = s(d.lastName);
      if (d.ssn !== undefined) updateData.ssn = s(d.ssn);
      if (d.dateOfBirth !== undefined) updateData.dateOfBirth = s(d.dateOfBirth);
      if (d.maritalStatus !== undefined) updateData.maritalStatus = sEnum(d.maritalStatus, ["single", "married", "divorced"]);
      if (d.cellPhone !== undefined) updateData.cellPhone = s(d.cellPhone);
      if (d.workPhone !== undefined) updateData.workPhone = s(d.workPhone);
      // Only update email if a non-empty value is provided (never overwrite registration email with null)
      if (d.email !== undefined && d.email !== null && String(d.email).trim() !== "") {
        updateData.email = s(d.email);
      }
      if (d.dlState !== undefined) updateData.dlState = s(d.dlState);
      if (d.dlNumber !== undefined) updateData.dlNumber = s(d.dlNumber);
      if (d.dlFrontUrl !== undefined) updateData.dlFrontUrl = s(d.dlFrontUrl);
      if (d.dlBackUrl !== undefined) updateData.dlBackUrl = s(d.dlBackUrl);
      if (d.currentStreet !== undefined) updateData.currentStreet = s(d.currentStreet);
      if (d.currentCity !== undefined) updateData.currentCity = s(d.currentCity);
      if (d.currentState !== undefined) updateData.currentState = s(d.currentState);
      if (d.currentZip !== undefined) updateData.currentZip = s(d.currentZip);
      if (d.reasonForMoving !== undefined) updateData.reasonForMoving = s(d.reasonForMoving);
      if (d.employerName !== undefined) updateData.employerName = s(d.employerName);
      if (d.employerStreet !== undefined) updateData.employerStreet = s(d.employerStreet);
      if (d.employerCity !== undefined) updateData.employerCity = s(d.employerCity);
      if (d.employerState !== undefined) updateData.employerState = s(d.employerState);
      if (d.employerZip !== undefined) updateData.employerZip = s(d.employerZip);
      if (d.position !== undefined) updateData.position = s(d.position);
      if (d.officePhone !== undefined) updateData.officePhone = s(d.officePhone);
      if (d.monthlyGrossPay !== undefined) updateData.monthlyGrossPay = s(d.monthlyGrossPay);
      if (d.supervisorName !== undefined) updateData.supervisorName = s(d.supervisorName);
      if (d.supervisorPhone !== undefined) updateData.supervisorPhone = s(d.supervisorPhone);
      if (d.additionalIncome !== undefined) updateData.additionalIncome = s(d.additionalIncome);
      if (d.employmentFrom !== undefined) updateData.employmentFrom = s(d.employmentFrom);
      if (d.employmentTo !== undefined) updateData.employmentTo = s(d.employmentTo);
      if (d.incomeProofUrls !== undefined && Array.isArray(d.incomeProofUrls)) {
        updateData.incomeProofUrls = d.incomeProofUrls;
      }
      if (d.emergencyName !== undefined) updateData.emergencyName = s(d.emergencyName);
      if (d.emergencyRelationship !== undefined) updateData.emergencyRelationship = s(d.emergencyRelationship);
      if (d.emergencyPhone !== undefined) updateData.emergencyPhone = s(d.emergencyPhone);
      if (d.emergencyEmail !== undefined) updateData.emergencyEmail = s(d.emergencyEmail);
      if (d.emergencyAddress !== undefined) updateData.emergencyAddress = s(d.emergencyAddress);
      if (d.emergencyCity !== undefined) updateData.emergencyCity = s(d.emergencyCity);
      if (d.emergencyState !== undefined) updateData.emergencyState = s(d.emergencyState);
      if (d.emergencyZip !== undefined) updateData.emergencyZip = s(d.emergencyZip);
      if (d.medicalName !== undefined) updateData.medicalName = s(d.medicalName);
      if (d.medicalPhone !== undefined) updateData.medicalPhone = s(d.medicalPhone);
      if (d.medicalEmail !== undefined) updateData.medicalEmail = s(d.medicalEmail);
      if (d.medicalAddress !== undefined) updateData.medicalAddress = s(d.medicalAddress);
      if (d.medicalCity !== undefined) updateData.medicalCity = s(d.medicalCity);
      if (d.medicalZip !== undefined) updateData.medicalZip = s(d.medicalZip);
      // General Information fields
      if (d.beenSued !== undefined) updateData.beenSued = s(d.beenSued);
      if (d.beenSued_explanation !== undefined) updateData.beenSued_explanation = s(d.beenSued_explanation);
      if (d.brokenLease !== undefined) updateData.brokenLease = s(d.brokenLease);
      if (d.brokenLease_explanation !== undefined) updateData.brokenLease_explanation = s(d.brokenLease_explanation);
      if (d.convictedFelony !== undefined) updateData.convictedFelony = s(d.convictedFelony);
      if (d.convictedFelony_explanation !== undefined) updateData.convictedFelony_explanation = s(d.convictedFelony_explanation);
      if (d.moveInAmountAvailable !== undefined) updateData.moveInAmountAvailable = s(d.moveInAmountAvailable);
      if (d.moveInAmount_explanation !== undefined) updateData.moveInAmount_explanation = s(d.moveInAmount_explanation);
      if (d.filedBankruptcy !== undefined) updateData.filedBankruptcy = s(d.filedBankruptcy);
      if (d.filedBankruptcy_explanation !== undefined) updateData.filedBankruptcy_explanation = s(d.filedBankruptcy_explanation);
      if (d.bankruptcyDischarged !== undefined) updateData.bankruptcyDischarged = s(d.bankruptcyDischarged);
      if (d.rentPlanDuration !== undefined) updateData.rentPlanDuration = s(d.rentPlanDuration);
      if (d.lockedOutBySheriff !== undefined) updateData.lockedOutBySheriff = s(d.lockedOutBySheriff);
      if (d.lockedOutBySheriff_explanation !== undefined) updateData.lockedOutBySheriff_explanation = s(d.lockedOutBySheriff_explanation);
      if (d.servedLateRentNote !== undefined) updateData.servedLateRentNote = s(d.servedLateRentNote);
      if (d.servedLateRentNote_explanation !== undefined) updateData.servedLateRentNote_explanation = s(d.servedLateRentNote_explanation);
      if (d.occupantsSmoke !== undefined) updateData.occupantsSmoke = s(d.occupantsSmoke);
      if (d.occupantsSmoke_explanation !== undefined) updateData.occupantsSmoke_explanation = s(d.occupantsSmoke_explanation);
      if (d.landlordProblems !== undefined) updateData.landlordProblems = s(d.landlordProblems);
      if (d.landlordProblemsExplanation !== undefined) updateData.landlordProblemsExplanation = s(d.landlordProblemsExplanation);
      if (d.additionalIncomeSource !== undefined) updateData.additionalIncomeSource = s(d.additionalIncomeSource);
      if (d.creditCheckComment !== undefined) updateData.creditCheckComment = s(d.creditCheckComment);
      if (d.petsInfo !== undefined) updateData.petsInfo = s(d.petsInfo);
      if (d.howHeardAboutHome !== undefined) updateData.howHeardAboutHome = s(d.howHeardAboutHome);

      if (d.signatureName !== undefined) {
        const sn = s(d.signatureName);
        if (sn && !sn.startsWith("__pwdhash__")) {
          updateData.signatureName = sn;
        }
      }
      if (d.signatureDrawUrl !== undefined) updateData.signatureDrawUrl = s(d.signatureDrawUrl);
      if (d.signatureDate !== undefined) updateData.signatureDate = s(d.signatureDate);

      await db
        .update(applications)
        .set(updateData)
        .where(eq(applications.id, input.applicationId));

      return { success: true };
    }),

  // Save co-applicants
  saveCoApplicants: publicProcedure
    .input(
      z.object({
        applicationId: z.number(),
        coApplicants: z.array(
          z.object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            ssn: z.string().optional(),
            dateOfBirth: z.string().optional(),
            maritalStatus: z
              .enum(["single", "married", "divorced"])
              .optional(),
            cellPhone: z.string().optional(),
            workPhone: z.string().optional(),
            email: z.string().optional(),
            dlState: z.string().optional(),
            dlNumber: z.string().optional(),
            currentStreet: z.string().optional(),
            currentCity: z.string().optional(),
            currentState: z.string().optional(),
            currentZip: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .delete(coApplicants)
        .where(eq(coApplicants.applicationId, input.applicationId));

      if (input.coApplicants.length > 0) {
        const rows = input.coApplicants.map((ca) => ({
          applicationId: input.applicationId,
          firstName: ca.firstName,
          lastName: ca.lastName,
          ssn: ca.ssn,
          dateOfBirth: ca.dateOfBirth,
          maritalStatus: ca.maritalStatus,
          cellPhone: ca.cellPhone,
          workPhone: ca.workPhone,
          email: ca.email,
          dlState: ca.dlState,
          dlNumber: ca.dlNumber,
          currentStreet: ca.currentStreet,
          currentCity: ca.currentCity,
          currentState: ca.currentState,
          currentZip: ca.currentZip,
        }));
        await db.insert(coApplicants).values(rows);
      }

      return { success: true };
    }),

  // Save vehicles
  saveVehicles: publicProcedure
    .input(
      z.object({
        applicationId: z.number(),
        vehicles: z.array(
          z.object({
            make: z.string().optional(),
            model: z.string().optional(),
            color: z.string().optional(),
            year: z.string().optional(),
            licensePlate: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .delete(vehicles)
        .where(eq(vehicles.applicationId, input.applicationId));

      if (input.vehicles.length > 0) {
        const rows = input.vehicles.map((v) => ({
          applicationId: input.applicationId,
          make: v.make,
          model: v.model,
          color: v.color,
          year: v.year,
          licensePlate: v.licensePlate,
        }));
        await db.insert(vehicles).values(rows);
      }

      return { success: true };
    }),

  // Admin: List all applications
  listApplications: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["pending", "under_review", "approved", "denied", "incomplete", "draft", "submitted"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const allApps = await db.select().from(applications);

      let filtered = allApps.filter((app) => {
        // Exclude draft password-only entries
        if (!app.firstName && !app.lastName && !app.propertyAddress) return false;
        if (input.status && app.status !== input.status) return false;
        if (input.search) {
          const q = input.search.toLowerCase();
          const name = `${app.firstName || ""} ${app.lastName || ""}`.toLowerCase();
          const email = (app.email || "").toLowerCase();
          const prop = (app.propertyAddress || "").toLowerCase();
          if (!name.includes(q) && !email.includes(q) && !prop.includes(q)) return false;
        }
        return true;
      });

      const stats = {
        total: filtered.length,
        pending: filtered.filter((a) => a.status === "pending" || a.status === "submitted").length,
        underReview: filtered.filter((a) => a.status === "under_review").length,
        approved: filtered.filter((a) => a.status === "approved").length,
        denied: filtered.filter((a) => a.status === "denied").length,
      };

      return {
        applications: filtered.map((app) => ({
          id: app.id,
          firstName: app.firstName,
          lastName: app.lastName,
          email: app.email ?? "",
          propertyAddress: app.propertyAddress,
          status: (app.status === "submitted" ? "pending" : app.status || "pending") as "pending" | "under_review" | "approved" | "denied" | "incomplete",
          currentStep: app.currentStep || 1,
          paymentStatus: app.paymentStatus || "unpaid",
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        })),
        stats,
      };
    }),

  // Admin: Get full application detail
  getApplicationDetail: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const apps = await db.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1);
      if (apps.length === 0) throw new Error("Application not found");

      const app = apps[0];
      const coApps = await db.select().from(coApplicants).where(eq(coApplicants.applicationId, input.applicationId));

      // Get emergency contacts from main application fields
      const emergencyContacts = [];
      if (app.emergencyName) {
        emergencyContacts.push({ name: app.emergencyName, relationship: app.emergencyRelationship, phone: app.emergencyPhone });
      }
      if (app.medicalName) {
        emergencyContacts.push({ name: app.medicalName, relationship: "Medical", phone: app.medicalPhone });
      }

      return {
        application: { ...app, signatureName: app.signatureName?.startsWith("__pwdhash__") ? null : app.signatureName },
        coApplicants: coApps,
        emergencyContacts,
      };
    }),

  // Admin: Update application status
  updateStatus: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        status: z.enum(["pending", "under_review", "approved", "denied", "incomplete"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(applications)
        .set({ status: input.status })
        .where(eq(applications.id, input.applicationId));

      return { success: true };
    }),

  // -------------------------------------------------------------------------
  // Save & Resume Later
  // -------------------------------------------------------------------------

  // Generate (or return existing) resume token for an application
  getResumeLink: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const apps = await db
        .select({ resumeToken: applications.resumeToken, resumeTokenExpiresAt: applications.resumeTokenExpiresAt, email: applications.email, currentStep: applications.currentStep })
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (apps.length === 0) throw new Error("Application not found");

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let token = apps[0].resumeToken;
      const expiresAt = apps[0].resumeTokenExpiresAt;

      // Generate a new token if none exists OR if the existing one is expired
      const isExpired = expiresAt && expiresAt < now;
      if (!token || isExpired) {
        const { randomBytes } = await import("crypto");
        token = randomBytes(24).toString("hex");
        await db
          .update(applications)
          .set({ resumeToken: token, resumeTokenExpiresAt: thirtyDaysFromNow })
          .where(eq(applications.id, input.applicationId));
      } else if (!expiresAt) {
        // Backfill expiry for tokens created before this feature was added
        await db
          .update(applications)
          .set({ resumeTokenExpiresAt: thirtyDaysFromNow })
          .where(eq(applications.id, input.applicationId));
      }

      const origin = ctx.req.headers.origin as string || "";
      const resumeUrl = `${origin}/resume/${token}`;
      const expiresIn = "30 days";
      return { token, resumeUrl, email: apps[0].email, expiresIn };
    }),

  // Look up an application by resume token (used by the /resume/:token page)
  resumeByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const apps = await db
        .select({
          id: applications.id,
          currentStep: applications.currentStep,
          email: applications.email,
          firstName: applications.firstName,
          lastName: applications.lastName,
          status: applications.status,
          resumeTokenExpiresAt: applications.resumeTokenExpiresAt,
        })
        .from(applications)
        .where(eq(applications.resumeToken, input.token))
        .limit(1);

      if (apps.length === 0) return null;
      const app = apps[0];

      // Check expiry before anything else
      if (app.resumeTokenExpiresAt && app.resumeTokenExpiresAt < new Date()) {
        return { expired: true, applicationId: app.id, email: app.email };
      }

      // Don’t allow resuming a submitted application
      if (app.status === "submitted" || app.status === "approved" || app.status === "denied") {
        return { alreadySubmitted: true, applicationId: app.id };
      }

      return {
        alreadySubmitted: false,
        expired: false,
        applicationId: app.id,
        currentStep: app.currentStep || 3,
        email: app.email,
        firstName: app.firstName,
        lastName: app.lastName,
      };
    }),

  // Send resume link email to the applicant
  sendResumeEmail: publicProcedure
    .input(z.object({ applicationId: z.number(), resumeUrl: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const apps = await db
        .select({ email: applications.email, firstName: applications.firstName, lastName: applications.lastName })
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (apps.length === 0) throw new Error("Application not found");
      const app = apps[0];
      if (!app.email) throw new Error("No email address on file for this application");

      const { sendResumeLink } = await import("../../emailService");
      await sendResumeLink({
        applicantName: `${app.firstName || ""} ${app.lastName || ""}`.trim() || app.email,
        applicantEmail: app.email,
        resumeUrl: input.resumeUrl,
        applicationId: input.applicationId,
      });

      return { success: true };
    }),

  // Submit final application
  submit: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(applications)
        .set({ status: "submitted", submittedAt: new Date(), currentStep: 7 })
        .where(eq(applications.id, input.applicationId));

      const apps = await db
        .select({
          firstName: applications.firstName,
          lastName: applications.lastName,
          email: applications.email,
          propertyAddress: applications.propertyAddress,
          paymentStatus: applications.paymentStatus,
          paymentAmount: applications.paymentAmount,
          stripePaymentIntentId: applications.stripePaymentIntentId,
        })
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (apps.length > 0) {
        const app = apps[0];
        const applicantName = `${app.firstName || ""} ${app.lastName || ""}`.trim() || app.email || "Applicant";

        // Notify owner (fire-and-forget)
        notifyOwner({
          title: "New Rental Application Submitted",
          content: `New application submitted.\n\nApplicant: ${app.firstName} ${app.lastName}\nEmail: ${app.email}\nProperty: ${app.propertyAddress || "Not specified"}\nApplication ID: ${input.applicationId}`,
        }).catch(() => {});

        // Send receipt email to applicant (fire-and-forget)
        if (app.email) {
          sendApplicationReceipt({
            applicationId: input.applicationId,
            applicantName,
            applicantEmail: app.email,
            propertyAddress: app.propertyAddress,
            submittedAt: new Date(),
            paymentStatus: (app.paymentStatus as "paid" | "unpaid") === "paid" ? "paid" : "unpaid",
            paymentAmount: app.paymentAmount,
            stripePaymentIntentId: app.stripePaymentIntentId,
          }).catch(() => {});
        }

        // Generate rental application PDF and email to staff (fire-and-forget)
        (async () => {
          try {
            const [fullApp] = await db.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1);
            if (!fullApp) return;

            const coApps = await db.select().from(coApplicants).where(eq(coApplicants.applicationId, input.applicationId));
            const vehicleList = await db.select().from(vehicles).where(eq(vehicles.applicationId, input.applicationId));

            const pdfData: RentalApplicationPDFData = {
              applicationId: input.applicationId,
              propertyAddress: fullApp.propertyAddress,
              submittedAt: fullApp.submittedAt,
              firstName: fullApp.firstName,
              lastName: fullApp.lastName,
              ssn: fullApp.ssn,
              dateOfBirth: fullApp.dateOfBirth,
              maritalStatus: fullApp.maritalStatus,
              cellPhone: fullApp.cellPhone,
              workPhone: fullApp.workPhone,
              email: fullApp.email,
              dlState: fullApp.dlState,
              dlNumber: fullApp.dlNumber,
              dlFrontUrl: fullApp.dlFrontUrl,
              dlBackUrl: fullApp.dlBackUrl,
              incomeProofUrls: fullApp.incomeProofUrls ?? undefined,
              currentStreet: fullApp.currentStreet,
              currentCity: fullApp.currentCity,
              currentState: fullApp.currentState,
              currentZip: fullApp.currentZip,
              reasonForMoving: fullApp.reasonForMoving,
              employerName: fullApp.employerName,
              employerStreet: fullApp.employerStreet,
              employerCity: fullApp.employerCity,
              employerState: fullApp.employerState,
              employerZip: fullApp.employerZip,
              position: fullApp.position,
              officePhone: fullApp.officePhone,
              monthlyGrossPay: fullApp.monthlyGrossPay,
              supervisorName: fullApp.supervisorName,
              supervisorPhone: fullApp.supervisorPhone,
              additionalIncome: fullApp.additionalIncome,
              employmentFrom: fullApp.employmentFrom,
              employmentTo: fullApp.employmentTo,
              emergencyName: fullApp.emergencyName,
              emergencyRelationship: fullApp.emergencyRelationship,
              emergencyPhone: fullApp.emergencyPhone,
              emergencyEmail: fullApp.emergencyEmail,
              emergencyAddress: fullApp.emergencyAddress,
              emergencyCity: fullApp.emergencyCity,
              emergencyState: fullApp.emergencyState,
              emergencyZip: fullApp.emergencyZip,
              medicalName: fullApp.medicalName,
              medicalPhone: fullApp.medicalPhone,
              medicalEmail: fullApp.medicalEmail,
              medicalAddress: fullApp.medicalAddress,
              medicalCity: fullApp.medicalCity,
              medicalZip: fullApp.medicalZip,
              beenSued: fullApp.beenSued,
              brokenLease: fullApp.brokenLease,
              convictedFelony: fullApp.convictedFelony,
              moveInAmountAvailable: fullApp.moveInAmountAvailable,
              filedBankruptcy: fullApp.filedBankruptcy,
              bankruptcyDischarged: fullApp.bankruptcyDischarged,
              rentPlanDuration: fullApp.rentPlanDuration,
              lockedOutBySheriff: fullApp.lockedOutBySheriff,
              servedLateRentNote: fullApp.servedLateRentNote,
              occupantsSmoke: fullApp.occupantsSmoke,
              landlordProblems: fullApp.landlordProblems,
              landlordProblemsExplanation: fullApp.landlordProblemsExplanation,
              additionalIncomeSource: fullApp.additionalIncomeSource,
              creditCheckComment: fullApp.creditCheckComment,
              petsInfo: fullApp.petsInfo,
              howHeardAboutHome: fullApp.howHeardAboutHome,
              signatureName: fullApp.signatureName?.startsWith("__pwdhash__") ? null : fullApp.signatureName,
              signatureDrawUrl: fullApp.signatureDrawUrl,
              signatureDate: fullApp.signatureDate,
              paymentStatus: fullApp.paymentStatus,
              paymentAmount: fullApp.paymentAmount ?? null,
              coApplicants: coApps.map((c) => ({
                firstName: c.firstName,
                lastName: c.lastName,
                ssn: c.ssn,
                dateOfBirth: c.dateOfBirth,
                cellPhone: c.cellPhone,
                email: c.email,
              })),
              vehicles: vehicleList.map((v) => ({
                make: v.make,
                model: v.model,
                color: v.color,
                year: v.year,
                licensePlate: v.licensePlate,
              })),
            };

            const pdfBuffer = await generateRentalApplicationPDF(pdfData);
            await sendRentalApplicationPdfToStaff({
              applicationId: input.applicationId,
              applicantName,
              applicantEmail: app.email,
              pdfBuffer,
            });
          } catch (err) {
            console.error("[Submit] Failed to generate/send rental application PDF for", input.applicationId, err);
          }
        })();
      }
      return { success: true };
    }),
});
