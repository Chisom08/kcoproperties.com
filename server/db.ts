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




const db = drizzle(process.env.DATABASE_URL!);

const sampleProperties = [
  {
    name: "Sunset View Apartments",
    address: "123 Sunset Boulevard",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90028",
    propertyType: "Apartment",
    bedrooms: 2,
    bathrooms: 20, // 2.0 bathrooms (stored as integer * 10)
    squareFeet: 1200,
    rentAmount: 250000, // $2,500/month in cents
    depositAmount: 250000,
    isAvailable: true,
    availableDate: new Date('2025-11-15'),
    description: "Beautiful 2-bedroom apartment with stunning sunset views. Modern kitchen with stainless steel appliances, in-unit washer/dryer, and private balcony. Walking distance to shops and restaurants.",
    amenities: JSON.stringify(["In-unit Washer/Dryer", "Dishwasher", "Balcony", "Parking Space", "Air Conditioning", "Hardwood Floors"]),
    petsAllowed: true,
    utilitiesIncluded: JSON.stringify(["Water", "Trash"]),
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200"
    ]),
  },
  {
    name: "Downtown Loft",
    address: "456 Main Street, Unit 3B",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    propertyType: "Loft",
    bedrooms: 1,
    bathrooms: 10, // 1.0 bathroom
    squareFeet: 850,
    rentAmount: 320000, // $3,200/month
    depositAmount: 320000,
    isAvailable: true,
    availableDate: new Date('2025-11-01'),
    description: "Stylish urban loft in the heart of downtown. Features exposed brick walls, high ceilings, and large windows with city views. Perfect for professionals.",
    amenities: JSON.stringify(["High Ceilings", "Exposed Brick", "Gym Access", "Rooftop Deck", "Bike Storage", "Package Room"]),
    petsAllowed: false,
    utilitiesIncluded: JSON.stringify(["Heat"]),
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200",
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200"
    ]),
  },
  {
    name: "Riverside Family Home",
    address: "789 River Road",
    city: "Portland",
    state: "OR",
    zipCode: "97201",
    propertyType: "House",
    bedrooms: 4,
    bathrooms: 25, // 2.5 bathrooms
    squareFeet: 2400,
    rentAmount: 350000, // $3,500/month
    depositAmount: 350000,
    isAvailable: true,
    availableDate: new Date('2025-12-01'),
    description: "Spacious 4-bedroom family home with large backyard and river views. Updated kitchen, master suite with walk-in closet, and attached 2-car garage. Great schools nearby.",
    amenities: JSON.stringify(["Backyard", "2-Car Garage", "Fireplace", "Updated Kitchen", "Master Suite", "Laundry Room"]),
    petsAllowed: true,
    utilitiesIncluded: JSON.stringify([]),
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200"
    ]),
  },
  {
    name: "Garden View Studio",
    address: "321 Park Avenue",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    propertyType: "Studio",
    bedrooms: 0,
    bathrooms: 10, // 1.0 bathroom
    squareFeet: 550,
    rentAmount: 165000, // $1,650/month
    depositAmount: 165000,
    isAvailable: true,
    availableDate: new Date('2025-11-10'),
    description: "Cozy studio apartment overlooking community gardens. Efficient layout with murphy bed, kitchenette, and plenty of natural light. Perfect for singles or students.",
    amenities: JSON.stringify(["Murphy Bed", "Garden View", "On-site Laundry", "Storage Unit", "Bike Parking"]),
    petsAllowed: false,
    utilitiesIncluded: JSON.stringify(["Water", "Trash", "Sewer"]),
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200"
    ]),
  },
  {
    name: "Luxury Penthouse",
    address: "100 Skyline Drive, PH1",
    city: "Miami",
    state: "FL",
    zipCode: "33131",
    propertyType: "Penthouse",
    bedrooms: 3,
    bathrooms: 30, // 3.0 bathrooms
    squareFeet: 3200,
    rentAmount: 750000, // $7,500/month
    depositAmount: 750000,
    isAvailable: false,
    description: "Stunning penthouse with panoramic ocean views. Floor-to-ceiling windows, gourmet kitchen, spa-like bathrooms, and private terrace. Concierge and valet services included.",
    amenities: JSON.stringify(["Ocean View", "Private Terrace", "Concierge", "Valet Parking", "Pool Access", "Fitness Center", "Wine Storage"]),
    petsAllowed: true,
    utilitiesIncluded: JSON.stringify(["Water", "Trash"]),
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200"
    ]),
  }
];

async function seed() {
  console.log('Seeding properties...');
  
  for (const property of sampleProperties) {
    await db.insert(properties).values(property);
    console.log(`✓ Added: ${property.name}`);
  }
  
  console.log('\n✅ Seeding complete! Added', sampleProperties.length, 'properties.');
  process.exit(0);
}



const sampleUnits = [
  // Garden View Studio - Property ID 1
  { propertyId: 1, unitNumber: '101', floor: 1, bedrooms: 0, bathrooms: 10, squareFeet: 550, rentAmount: 165000, depositAmount: 165000, isAvailable: true, availableDate: new Date() },
  { propertyId: 1, unitNumber: '102', floor: 1, bedrooms: 0, bathrooms: 10, squareFeet: 550, rentAmount: 165000, depositAmount: 165000, isAvailable: true, availableDate: new Date() },
  { propertyId: 1, unitNumber: '201', floor: 2, bedrooms: 0, bathrooms: 10, squareFeet: 550, rentAmount: 165000, depositAmount: 165000, isAvailable: false },
  { propertyId: 1, unitNumber: '202', floor: 2, bedrooms: 0, bathrooms: 10, squareFeet: 550, rentAmount: 165000, depositAmount: 165000, isAvailable: true, availableDate: new Date('2025-12-15') },
  
  // Sunset View Apartments - Property ID 2
  { propertyId: 2, unitNumber: 'A1', floor: 1, bedrooms: 1, bathrooms: 10, squareFeet: 750, rentAmount: 220000, depositAmount: 220000, isAvailable: true, availableDate: new Date() },
  { propertyId: 2, unitNumber: 'A2', floor: 1, bedrooms: 1, bathrooms: 10, squareFeet: 750, rentAmount: 220000, depositAmount: 220000, isAvailable: true, availableDate: new Date() },
  { propertyId: 2, unitNumber: 'B1', floor: 2, bedrooms: 1, bathrooms: 10, squareFeet: 800, rentAmount: 235000, depositAmount: 235000, isAvailable: true, availableDate: new Date() },
  { propertyId: 2, unitNumber: 'B2', floor: 2, bedrooms: 1, bathrooms: 10, squareFeet: 800, rentAmount: 235000, depositAmount: 235000, isAvailable: false },
  
  // Downtown Loft - Property ID 3
  { propertyId: 3, unitNumber: '301', floor: 3, bedrooms: 2, bathrooms: 20, squareFeet: 1200, rentAmount: 320000, depositAmount: 320000, isAvailable: true, availableDate: new Date() },
  { propertyId: 3, unitNumber: '302', floor: 3, bedrooms: 2, bathrooms: 20, squareFeet: 1200, rentAmount: 320000, depositAmount: 320000, isAvailable: true, availableDate: new Date('2025-12-01') },
  { propertyId: 3, unitNumber: '401', floor: 4, bedrooms: 2, bathrooms: 20, squareFeet: 1250, rentAmount: 335000, depositAmount: 335000, isAvailable: true, availableDate: new Date() },
  
  // Riverside Townhome - Property ID 4
  { propertyId: 4, unitNumber: '1A', floor: 1, bedrooms: 3, bathrooms: 25, squareFeet: 1800, rentAmount: 285000, depositAmount: 285000, isAvailable: true, availableDate: new Date() },
  { propertyId: 4, unitNumber: '1B', floor: 1, bedrooms: 3, bathrooms: 25, squareFeet: 1800, rentAmount: 285000, depositAmount: 285000, isAvailable: false },
  { propertyId: 4, unitNumber: '2A', floor: 1, bedrooms: 3, bathrooms: 25, squareFeet: 1850, rentAmount: 295000, depositAmount: 295000, isAvailable: true, availableDate: new Date('2025-12-10') },
  
  // Luxury Penthouse Suite - Property ID 5
  { propertyId: 5, unitNumber: 'PH1', floor: 10, bedrooms: 3, bathrooms: 30, squareFeet: 2500, rentAmount: 450000, depositAmount: 450000, isAvailable: true, availableDate: new Date() },
  { propertyId: 5, unitNumber: 'PH2', floor: 10, bedrooms: 3, bathrooms: 30, squareFeet: 2500, rentAmount: 450000, depositAmount: 450000, isAvailable: false },
];

async function seedUnits() {
  console.log('Seeding units...');
  
  for (const unit of sampleUnits) {
    await db.insert(units).values(unit);
    console.log(`✓ Created unit ${unit.unitNumber} for property ${unit.propertyId}`);
  }
  
  console.log('✓ Units seeded successfully!');
  process.exit(0);
}

seedUnits().catch((error) => {
  console.error('Error seeding units:', error);
  process.exit(1);
});

