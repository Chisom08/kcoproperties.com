import { eq, and, gte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  properties, 
  InsertProperty,
  applications,
  InsertApplication,
  leases,
  InsertLease,
  payments,
  InsertPayment,
  maintenanceRequests,
  InsertMaintenanceRequest,
  messages,
  InsertMessage,
  tourBookings,
  InsertTourBooking,
  contactMessages,
  InsertContactMessage,
  units,
  InsertUnit
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Property queries
export async function getAllProperties() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(properties).orderBy(desc(properties.createdAt));
}

export async function getAvailableProperties() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(properties)
    .where(eq(properties.isAvailable, true))
    .orderBy(asc(properties.rentAmount));
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProperty(property: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(properties).values(property);
  return result;
}

export async function updateProperty(id: number, updates: Partial<InsertProperty>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(properties).set(updates).where(eq(properties.id, id));
}

export async function deleteProperty(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(properties).where(eq(properties.id, id));
}

// Application queries
export async function getAllApplications() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(applications).orderBy(desc(applications.createdAt));
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getApplicationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt));
}

export async function getApplicationsByPropertyId(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(applications)
    .where(eq(applications.propertyId, propertyId))
    .orderBy(desc(applications.createdAt));
}

export async function createApplication(application: InsertApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(applications).values(application);
  return result;
}

export async function updateApplication(id: number, updates: Partial<InsertApplication>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(applications).set(updates).where(eq(applications.id, id));
}

// Lease queries
export async function getLeasesByTenantId(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(leases)
    .where(eq(leases.tenantId, tenantId))
    .orderBy(desc(leases.createdAt));
}

export async function getActiveLeaseByTenantId(tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leases)
    .where(and(eq(leases.tenantId, tenantId), eq(leases.status, 'active')))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLease(lease: InsertLease) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leases).values(lease);
  return result;
}

// Payment queries
export async function getPaymentsByLeaseId(leaseId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments)
    .where(eq(payments.leaseId, leaseId))
    .orderBy(desc(payments.paymentDate));
}

export async function getPaymentsByTenantId(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments)
    .where(eq(payments.tenantId, tenantId))
    .orderBy(desc(payments.paymentDate));
}

export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values(payment);
  return result;
}

// Maintenance request queries
export async function getMaintenanceRequestsByTenantId(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(maintenanceRequests)
    .where(eq(maintenanceRequests.tenantId, tenantId))
    .orderBy(desc(maintenanceRequests.createdAt));
}

export async function getMaintenanceRequestsByPropertyId(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(maintenanceRequests)
    .where(eq(maintenanceRequests.propertyId, propertyId))
    .orderBy(desc(maintenanceRequests.createdAt));
}

export async function getAllMaintenanceRequests() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(maintenanceRequests).orderBy(desc(maintenanceRequests.createdAt));
}

export async function createMaintenanceRequest(request: InsertMaintenanceRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(maintenanceRequests).values(request);
  return result;
}

export async function updateMaintenanceRequest(id: number, updates: Partial<InsertMaintenanceRequest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(maintenanceRequests).set(updates).where(eq(maintenanceRequests.id, id));
}

// Message queries
export async function getMessagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messages)
    .where(eq(messages.recipientId, userId))
    .orderBy(desc(messages.createdAt));
}

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(message);
  return result;
}

// Tour Booking queries
export async function getAllTourBookings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tourBookings).orderBy(desc(tourBookings.createdAt));
}

export async function getTourBookingsByPropertyId(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tourBookings)
    .where(eq(tourBookings.propertyId, propertyId))
    .orderBy(desc(tourBookings.tourDate));
}

export async function createTourBooking(booking: InsertTourBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tourBookings).values(booking);
  return result;
}

export async function updateTourBooking(id: number, updates: Partial<InsertTourBooking>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tourBookings).set(updates).where(eq(tourBookings.id, id));
}

// Contact Messages
export async function createContactMessage(data: InsertContactMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contactMessages).values(data);
  return result;
}

export async function getAllContactMessages() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

// Unit queries
export async function getUnitsByPropertyId(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(units)
    .where(eq(units.propertyId, propertyId))
    .orderBy(asc(units.unitNumber));
}

export async function getAvailableUnitsByPropertyId(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(units)
    .where(and(eq(units.propertyId, propertyId), eq(units.isAvailable, true)))
    .orderBy(asc(units.unitNumber));
}

export async function getUnitById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(units)
    .where(eq(units.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUnit(unit: InsertUnit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(units).values(unit);
  return result;
}

export async function updateUnit(id: number, updates: Partial<InsertUnit>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(units).set(updates).where(eq(units.id, id));
}

export async function deleteUnit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(units).where(eq(units.id, id));
}
