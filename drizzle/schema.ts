import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Properties table - stores rental properties
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zipCode: varchar("zipCode", { length: 20 }).notNull(),
  propertyType: varchar("propertyType", { length: 50 }).notNull(), // apartment, house, condo, etc.
  bedrooms: int("bedrooms").notNull(),
  bathrooms: int("bathrooms").notNull(), // stored as integer (1.5 bath = 15, divide by 10)
  squareFeet: int("squareFeet"),
  rentAmount: int("rentAmount").notNull(), // stored in cents
  depositAmount: int("depositAmount").notNull(), // stored in cents
  isAvailable: boolean("isAvailable").default(false).notNull(),
  availableDate: timestamp("availableDate"),
  description: text("description"),
  amenities: text("amenities"), // JSON string array
  petsAllowed: boolean("petsAllowed").default(false).notNull(),
  utilitiesIncluded: text("utilitiesIncluded"), // JSON string array
  images: text("images"), // JSON string array of S3 URLs
  floorPlanUrl: varchar("floorPlanUrl", { length: 500 }),
  virtualTourUrl: varchar("virtualTourUrl", { length: 500 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Rental applications table
 */
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  userId: int("userId"), // optional - may be null for non-authenticated applicants
  status: mysqlEnum("status", ["pending", "under_review", "approved", "denied", "incomplete"]).default("pending").notNull(),
  
  // Applicant Information
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  ssnLast4: varchar("ssnLast4", { length: 4 }),
  
  // Current Address
  currentAddress: text("currentAddress"),
  moveInDate: varchar("moveInDate", { length: 20 }),
  moveOutDate: varchar("moveOutDate", { length: 20 }),
  reasonForLeaving: text("reasonForLeaving"),
  previousLandlordName: varchar("previousLandlordName", { length: 255 }),
  previousLandlordPhone: varchar("previousLandlordPhone", { length: 50 }),
  
  // Employment
  employerName: varchar("employerName", { length: 255 }),
  position: varchar("position", { length: 255 }),
  monthlyIncome: int("monthlyIncome"), // stored in cents
  supervisorContact: varchar("supervisorContact", { length: 255 }),
  
  // Additional Information
  additionalOccupants: text("additionalOccupants"), // JSON string
  pets: text("pets"), // JSON string
  vehicles: text("vehicles"), // JSON string
  emergencyContactName: varchar("emergencyContactName", { length: 255 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 50 }),
  
  // Consent & Documents
  consentGiven: boolean("consentGiven").default(false).notNull(),
  signatureData: text("signatureData"),
  signatureDate: timestamp("signatureDate"),
  idDocumentUrl: varchar("idDocumentUrl", { length: 500 }),
  incomeProofUrl: varchar("incomeProofUrl", { length: 500 }),
  
  // Payment
  applicationFeePaid: boolean("applicationFeePaid").default(false).notNull(),
  applicationFeeAmount: int("applicationFeeAmount"), // stored in cents
  paymentTransactionId: varchar("paymentTransactionId", { length: 255 }),
  
  // Admin Notes
  adminNotes: text("adminNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

/**
 * Leases table - active tenant leases
 */
export const leases = mysqlTable("leases", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  tenantId: int("tenantId").notNull(), // references users.id
  applicationId: int("applicationId"),
  
  leaseStartDate: timestamp("leaseStartDate").notNull(),
  leaseEndDate: timestamp("leaseEndDate").notNull(),
  monthlyRent: int("monthlyRent").notNull(), // stored in cents
  securityDeposit: int("securityDeposit").notNull(), // stored in cents
  
  leaseDocumentUrl: varchar("leaseDocumentUrl", { length: 500 }),
  status: mysqlEnum("status", ["active", "expired", "terminated", "pending"]).default("pending").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lease = typeof leases.$inferSelect;
export type InsertLease = typeof leases.$inferInsert;

/**
 * Payments table - rent and other payments
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  leaseId: int("leaseId").notNull(),
  tenantId: int("tenantId").notNull(),
  
  amount: int("amount").notNull(), // stored in cents
  paymentType: mysqlEnum("paymentType", ["rent", "deposit", "fee", "other"]).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  transactionId: varchar("transactionId", { length: 255 }),
  
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  dueDate: timestamp("dueDate"),
  
  notes: text("notes"),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Maintenance requests table
 */
export const maintenanceRequests = mysqlTable("maintenanceRequests", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  tenantId: int("tenantId").notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  urgency: mysqlEnum("urgency", ["low", "medium", "high", "emergency"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "completed", "cancelled"]).default("open").notNull(),
  
  images: text("images"), // JSON string array of S3 URLs
  
  assignedTo: int("assignedTo"),
  completedAt: timestamp("completedAt"),
  
  adminNotes: text("adminNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = typeof maintenanceRequests.$inferInsert;

/**
 * Messages table - communication between tenants and management
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId"),
  propertyId: int("propertyId"),
  
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Tour bookings table - property tour scheduling
 */
export const tourBookings = mysqlTable("tourBookings", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  
  // Visitor Information
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  
  // Tour Details
  tourDate: varchar("tourDate", { length: 20 }).notNull(),
  tourTime: varchar("tourTime", { length: 20 }).notNull(),
  numberOfPeople: int("numberOfPeople").default(1),
  message: text("message"),
  
  // Status
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled", "no_show"]).default("pending").notNull(),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  
  // Admin
  confirmedBy: int("confirmedBy"),
  confirmedAt: timestamp("confirmedAt"),
  adminNotes: text("adminNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TourBooking = typeof tourBookings.$inferSelect;
export type InsertTourBooking = typeof tourBookings.$inferInsert;

export const contactMessages = mysqlTable("contactMessages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "responded"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

/**
 * Units table - individual units within properties
 */
export const units = mysqlTable("units", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  
  // Unit Details
  unitNumber: varchar("unitNumber", { length: 50 }).notNull(),
  floor: int("floor"),
  bedrooms: int("bedrooms").notNull(),
  bathrooms: int("bathrooms").notNull(), // stored as integer (1.5 bath = 15, divide by 10)
  squareFeet: int("squareFeet"),
  rentAmount: int("rentAmount").notNull(), // stored in cents
  depositAmount: int("depositAmount").notNull(), // stored in cents
  
  // Availability
  isAvailable: boolean("isAvailable").default(true).notNull(),
  availableDate: timestamp("availableDate"),
  currentTenantId: int("currentTenantId"),
  leaseEndDate: timestamp("leaseEndDate"),
  
  // Unit Specific Features
  amenities: text("amenities"), // JSON string array
  images: text("images"), // JSON string array of S3 URLs
  floorPlanUrl: varchar("floorPlanUrl", { length: 500 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

/**
 * Co-Applicants table - for rental applications
 */
export const coApplicants = mysqlTable("co_applicants", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  ssn: varchar("ssn", { length: 20 }),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  maritalStatus: mysqlEnum("maritalStatus", ["single", "married", "divorced"]),
  cellPhone: varchar("cellPhone", { length: 20 }),
  workPhone: varchar("workPhone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  dlState: varchar("dlState", { length: 2 }),
  dlNumber: varchar("dlNumber", { length: 50 }),
  dlFrontUrl: text("dlFrontUrl"),
  dlBackUrl: text("dlBackUrl"),
  currentStreet: text("currentStreet"),
  currentCity: varchar("currentCity", { length: 100 }),
  currentState: varchar("currentState", { length: 2 }),
  currentZip: varchar("currentZip", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoApplicant = typeof coApplicants.$inferSelect;
export type InsertCoApplicant = typeof coApplicants.$inferInsert;

/**
 * Vehicles table - for rental applications
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  make: varchar("make", { length: 100 }),
  model: varchar("model", { length: 100 }),
  color: varchar("color", { length: 50 }),
  year: varchar("year", { length: 4 }),
  licensePlate: varchar("licensePlate", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Rental Applications table - for the rental app feature module
 * This is separate from the main applications table to avoid schema conflicts
 */
export const rentalApplications = mysqlTable("rental_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  status: mysqlEnum("status", ["draft", "submitted", "approved", "rejected", "pending", "under_review", "denied", "incomplete"]).default("draft").notNull(),

  // Property
  propertyAddress: text("propertyAddress"),

  // Personal Info
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  ssn: varchar("ssn", { length: 20 }),
  dateOfBirth: varchar("dateOfBirth", { length: 20 }),
  maritalStatus: mysqlEnum("maritalStatus", ["single", "married", "divorced"]),
  cellPhone: varchar("cellPhone", { length: 20 }),
  workPhone: varchar("workPhone", { length: 20 }),
  email: varchar("email", { length: 320 }),

  // Driver's License
  dlState: varchar("dlState", { length: 2 }),
  dlNumber: varchar("dlNumber", { length: 50 }),
  dlFrontUrl: text("dlFrontUrl"),
  dlBackUrl: text("dlBackUrl"),

  // Current Residence
  currentStreet: text("currentStreet"),
  currentCity: varchar("currentCity", { length: 100 }),
  currentState: varchar("currentState", { length: 2 }),
  currentZip: varchar("currentZip", { length: 10 }),

  // Reason for moving
  reasonForMoving: varchar("reasonForMoving", { length: 100 }),

  // Employment
  employerName: text("employerName"),
  employerStreet: text("employerStreet"),
  employerCity: varchar("employerCity", { length: 100 }),
  employerState: varchar("employerState", { length: 2 }),
  employerZip: varchar("employerZip", { length: 10 }),
  position: varchar("position", { length: 100 }),
  officePhone: varchar("officePhone", { length: 20 }),
  monthlyGrossPay: varchar("monthlyGrossPay", { length: 50 }),
  supervisorName: varchar("supervisorName", { length: 200 }),
  supervisorPhone: varchar("supervisorPhone", { length: 20 }),
  additionalIncome: text("additionalIncome"),
  employmentFrom: varchar("employmentFrom", { length: 20 }),
  employmentTo: varchar("employmentTo", { length: 20 }),
  incomeProofUrls: json("incomeProofUrls").$type<string[]>(),

  // Emergency Contact
  emergencyName: varchar("emergencyName", { length: 200 }),
  emergencyRelationship: varchar("emergencyRelationship", { length: 100 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  emergencyEmail: varchar("emergencyEmail", { length: 320 }),
  emergencyAddress: text("emergencyAddress"),
  emergencyCity: varchar("emergencyCity", { length: 100 }),
  emergencyState: varchar("emergencyState", { length: 2 }),
  emergencyZip: varchar("emergencyZip", { length: 10 }),

  // Medical Contact
  medicalName: varchar("medicalName", { length: 200 }),
  medicalPhone: varchar("medicalPhone", { length: 20 }),
  medicalEmail: varchar("medicalEmail", { length: 320 }),
  medicalAddress: text("medicalAddress"),
  medicalCity: varchar("medicalCity", { length: 100 }),
  medicalZip: varchar("medicalZip", { length: 10 }),

  // General Information (Yes/No questions + explanations)
  beenSued: varchar("beenSued", { length: 3 }),
  beenSued_explanation: text("beenSued_explanation"),
  brokenLease: varchar("brokenLease", { length: 3 }),
  brokenLease_explanation: text("brokenLease_explanation"),
  convictedFelony: varchar("convictedFelony", { length: 3 }),
  convictedFelony_explanation: text("convictedFelony_explanation"),
  moveInAmountAvailable: varchar("moveInAmountAvailable", { length: 3 }),
  moveInAmount_explanation: text("moveInAmount_explanation"),
  filedBankruptcy: varchar("filedBankruptcy", { length: 3 }),
  filedBankruptcy_explanation: text("filedBankruptcy_explanation"),
  bankruptcyDischarged: varchar("bankruptcyDischarged", { length: 3 }),
  rentPlanDuration: text("rentPlanDuration"),
  lockedOutBySheriff: varchar("lockedOutBySheriff", { length: 3 }),
  lockedOutBySheriff_explanation: text("lockedOutBySheriff_explanation"),
  servedLateRentNote: varchar("servedLateRentNote", { length: 3 }),
  servedLateRentNote_explanation: text("servedLateRentNote_explanation"),
  occupantsSmoke: varchar("occupantsSmoke", { length: 3 }),
  occupantsSmoke_explanation: text("occupantsSmoke_explanation"),
  landlordProblems: varchar("landlordProblems", { length: 3 }),
  landlordProblemsExplanation: text("landlordProblemsExplanation"),
  additionalIncomeSource: text("additionalIncomeSource"),
  creditCheckComment: text("creditCheckComment"),
  petsInfo: text("petsInfo"),
  howHeardAboutHome: text("howHeardAboutHome"),

  // Authentication
  passwordHash: varchar("passwordHash", { length: 100 }),

  // Stripe Payment
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 100 }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 100 }),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid"),
  paymentAmount: int("paymentAmount"),

  // Signature
  signatureName: varchar("signatureName", { length: 200 }),
  signatureDrawUrl: text("signatureDrawUrl"),
  signatureDate: varchar("signatureDate", { length: 30 }),

  // Current step for resume
  currentStep: int("currentStep").default(1),

  // Save & Resume Later — unique token for passwordless resume link
  resumeToken: varchar("resumeToken", { length: 64 }),
  resumeTokenExpiresAt: timestamp("resumeTokenExpiresAt"),
  // Automated reminder email — set when the 7-day nudge has been sent
  reminderSentAt: timestamp("reminderSentAt"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  submittedAt: timestamp("submittedAt"),
});

export type RentalApplication = typeof rentalApplications.$inferSelect;
export type InsertRentalApplication = typeof rentalApplications.$inferInsert;
