import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";
import { sendTourConfirmationEmail, sendApplicationPdfEmail } from "./emailService";
import { cloudinary } from "./_core/cloudinary";
import { InsertApplication } from "../drizzle/schema";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  properties: router({
    list: publicProcedure.query(async () => {
      return await db.getAllProperties();
    }),
    
    available: publicProcedure.query(async () => {
      return await db.getAvailableProperties();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Property not found' });
        }
        return property;
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        propertyType: z.string(),
        bedrooms: z.number(),
        bathrooms: z.number(),
        squareFeet: z.number().optional(),
        rentAmount: z.number(),
        depositAmount: z.number(),
        isAvailable: z.boolean().default(false),
        availableDate: z.date().optional(),
        description: z.string().optional(),
        amenities: z.string().optional(),
        petsAllowed: z.boolean().default(false),
        utilitiesIncluded: z.string().optional(),
        images: z.string().optional(),
        floorPlanUrl: z.string().optional(),
        virtualTourUrl: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProperty(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          propertyType: z.string().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          squareFeet: z.number().optional(),
          rentAmount: z.number().optional(),
          depositAmount: z.number().optional(),
          isAvailable: z.boolean().optional(),
          availableDate: z.date().optional(),
          description: z.string().optional(),
          amenities: z.string().optional(),
          petsAllowed: z.boolean().optional(),
          utilitiesIncluded: z.string().optional(),
          images: z.string().optional(),
          floorPlanUrl: z.string().optional(),
          virtualTourUrl: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
        })
      }))
      .mutation(async ({ input }) => {
        await db.updateProperty(input.id, input.data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProperty(input.id);
        return { success: true };
      }),
  }),

  applications: router({
    list: adminProcedure.query(async () => {
      return await db.getAllApplications();
    }),
    
    myApplications: protectedProcedure.query(async ({ ctx }) => {
      return await db.getApplicationsByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const application = await db.getApplicationById(input.id);
        if (!application) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
        }
        // Only allow viewing own applications unless admin
        if (ctx.user.role !== 'admin' && application.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return application;
      }),
    
    create: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        userId: z.number().optional(),
        fullName: z.string(),
        email: z.string().email(),
        phone: z.string(),
        dateOfBirth: z.string().optional(),
        ssnLast4: z.string().optional(),
        currentAddress: z.string().optional(),
        moveInDate: z.string().optional(),
        moveOutDate: z.string().optional(),
        reasonForLeaving: z.string().optional(),
        previousLandlordName: z.string().optional(),
        previousLandlordPhone: z.string().optional(),
        employerName: z.string().optional(),
        position: z.string().optional(),
        monthlyIncome: z.number().optional(),
        supervisorContact: z.string().optional(),
        // Extra employment fields used only for PDF/email (not stored in DB)
        employerAddress: z.string().optional(),
        employmentLength: z.string().optional(),
        additionalIncome: z.string().optional(),
        additionalIncomeSource: z.string().optional(),
        supervisorName: z.string().optional(),
        supervisorPhone: z.string().optional(),
        additionalOccupants: z.string().optional(),
        pets: z.string().optional(),
        vehicles: z.string().optional(),
        hasPets: z.boolean().optional(),
        hasVehicles: z.boolean().optional(),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
        emergencyContactRelation: z.string().optional(),
        consentGiven: z.boolean(),
        signatureData: z.string().optional(),
        signatureDate: z.date().optional(),
        idDocumentUrl: z.string().optional(),
        incomeProofUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Only persist fields that exist in the applications table
        const dbApplication: InsertApplication = {
          propertyId: input.propertyId,
          userId: input.userId,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          dateOfBirth: input.dateOfBirth,
          ssnLast4: input.ssnLast4,
          currentAddress: input.currentAddress,
          moveInDate: input.moveInDate,
          moveOutDate: input.moveOutDate,
          reasonForLeaving: input.reasonForLeaving,
          previousLandlordName: input.previousLandlordName,
          previousLandlordPhone: input.previousLandlordPhone,
          employerName: input.employerName,
          position: input.position,
          monthlyIncome: input.monthlyIncome,
          supervisorContact: input.supervisorContact,
          additionalOccupants: input.additionalOccupants,
          pets: input.pets,
          vehicles: input.vehicles,
          emergencyContactName: input.emergencyContactName,
          emergencyContactPhone: input.emergencyContactPhone,
          consentGiven: input.consentGiven,
          signatureData: input.signatureData,
          signatureDate: input.signatureDate,
          idDocumentUrl: input.idDocumentUrl,
          incomeProofUrl: input.incomeProofUrl,
        };

        const result = await db.createApplication(dbApplication);
        
        // Get property details for notification
        const property = await db.getPropertyById(input.propertyId);
        const propertyName = property ? property.name : `Property #${input.propertyId}`;
        
        // Send notification to owner
        await notifyOwner({
          title: "New Rental Application Received",
          content: `New application from ${input.fullName} for ${propertyName}.\n\nContact: ${input.email} | ${input.phone}\n\nView in the Database panel to review details.`
        }).catch(err => {
          console.error("Failed to send application notification:", err);
        });

        // Generate PDF of application and email to KCO / Plaxsys
        sendApplicationPdfEmail(input, propertyName).catch(err => {
          console.error("Failed to send application PDF email:", err);
        });
        
        return result;
      }),
    
    uploadDocument: publicProcedure
      .input(z.object({
        imageBase64: z.string(),
        category: z.enum(["id", "income"]),
      }))
      .mutation(async ({ input }) => {
        if (!input.imageBase64.startsWith("data:image/")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only image uploads are allowed" });
        }

        try {
          const result = await cloudinary.uploader.upload(input.imageBase64, {
            folder: "kco-properties/applications",
            resource_type: "image",
            overwrite: true,
          });

          return { url: result.secure_url };
        } catch (error) {
          console.error("Cloudinary upload failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to upload image" });
        }
      }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'under_review', 'approved', 'denied', 'incomplete']),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateApplication(input.id, {
          status: input.status,
          adminNotes: input.adminNotes,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        });
        return { success: true };
      }),
  }),

  tenant: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const lease = await db.getActiveLeaseByTenantId(ctx.user.id);
      if (!lease) {
        return { hasActiveLease: false };
      }
      
      const property = await db.getPropertyById(lease.propertyId);
      const payments = await db.getPaymentsByLeaseId(lease.id);
      const maintenanceRequests = await db.getMaintenanceRequestsByTenantId(ctx.user.id);
      
      return {
        hasActiveLease: true,
        lease,
        property,
        payments,
        maintenanceRequests,
      };
    }),
    
    submitMaintenanceRequest: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        title: z.string(),
        description: z.string(),
        urgency: z.enum(['low', 'medium', 'high', 'emergency']),
        images: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createMaintenanceRequest({
          ...input,
          tenantId: ctx.user.id,
        });
      }),
  }),

  admin: router({
    maintenanceRequests: adminProcedure.query(async () => {
      return await db.getAllMaintenanceRequests();
    }),
    
    updateMaintenanceRequest: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
        assignedTo: z.number().optional(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateMaintenanceRequest(id, updates);
        return { success: true };
      }),
  }),

  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createContactMessage(input);
        
        // Send notification to owner
        await notifyOwner({
          title: "New Contact Form Submission",
          content: `New message from ${input.name}\n\nSubject: ${input.subject}\nEmail: ${input.email}${input.phone ? `\nPhone: ${input.phone}` : ''}\n\nMessage:\n${input.message}\n\nView in the Database panel under contactMessages.`
        }).catch(err => {
          console.error("Failed to send contact notification:", err);
        });
        
        return result;
      }),
    
    list: adminProcedure.query(async () => {
      return await db.getAllContactMessages();
    }),
  }),

  tours: router({
    list: adminProcedure.query(async () => {
      return await db.getAllTourBookings();
    }),
    
    byProperty: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTourBookingsByPropertyId(input.propertyId);
      }),
    
    create: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        fullName: z.string(),
        email: z.string().email(),
        phone: z.string(),
        tourDate: z.string(),
        tourTime: z.string(),
        numberOfPeople: z.number().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createTourBooking(input);
        
        // Get property details for confirmation email
        const property = await db.getPropertyById(input.propertyId);
        const propertyName = property ? property.name : `Property #${input.propertyId}`;
        const propertyAddress = property ? property.address : 'Address TBD';
        
        // Send confirmation email to visitor with calendar invite
        sendTourConfirmationEmail({
          propertyName,
          propertyAddress,
          tourDate: input.tourDate,
          tourTime: input.tourTime,
          attendeeName: input.fullName,
          attendeeEmail: input.email,
          numberOfPeople: input.numberOfPeople || 1,
        }).catch(err => {
          console.error("Failed to send tour confirmation email:", err);
        });
        
        // Send notification to owner
        await notifyOwner({
          title: "New Property Tour Request",
          content: `Tour request from ${input.fullName} for ${propertyName}.\n\nDate: ${input.tourDate} at ${input.tourTime}\nContact: ${input.email} | ${input.phone}${input.message ? `\n\nMessage: ${input.message}` : ''}\n\nConfirmation email sent to visitor.`
        }).catch(err => {
          console.error("Failed to send tour notification:", err);
        });
        
        return result;
      }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateTourBooking(input.id, {
          status: input.status,
          adminNotes: input.adminNotes,
          confirmedBy: ctx.user.id,
          confirmedAt: new Date(),
        });
        return { success: true };
      }),
  }),

  units: router({    list: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getUnitsByPropertyId(input.propertyId);
      }),
    
    available: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAvailableUnitsByPropertyId(input.propertyId);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const unit = await db.getUnitById(input.id);
        if (!unit) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' });
        }
        return unit;
      }),
    
    create: adminProcedure
      .input(z.object({
        propertyId: z.number(),
        unitNumber: z.string(),
        floor: z.number().optional(),
        bedrooms: z.number(),
        bathrooms: z.number(),
        squareFeet: z.number().optional(),
        rentAmount: z.number(),
        depositAmount: z.number(),
        isAvailable: z.boolean().optional(),
        availableDate: z.date().optional(),
        amenities: z.string().optional(),
        images: z.string().optional(),
        floorPlanUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createUnit(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        unitNumber: z.string().optional(),
        floor: z.number().optional(),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
        squareFeet: z.number().optional(),
        rentAmount: z.number().optional(),
        depositAmount: z.number().optional(),
        isAvailable: z.boolean().optional(),
        availableDate: z.date().optional(),
        currentTenantId: z.number().optional(),
        leaseEndDate: z.date().optional(),
        amenities: z.string().optional(),
        images: z.string().optional(),
        floorPlanUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateUnit(id, updates);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUnit(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
