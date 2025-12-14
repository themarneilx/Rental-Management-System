import { pgTable, uuid, text, decimal, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- USERS & AUTH ---

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed with bcrypt
  role: text("role").notNull(), // 'Super Admin', 'Property Manager', 'Billing Admin'
  status: text("status").default("Active").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed
  phone: text("phone").notNull(),
  deposit: decimal("deposit", { precision: 10, scale: 2 }).notNull(),
  leaseEnd: date("lease_end").notNull(),
  status: text("status").notNull(), // 'Active', 'Archived'
  avatarUrl: text("avatar_url"),
  contractUrl: text("contract_url"),
  
  // Foreign Key
  roomId: uuid("room_id").references(() => rooms.id),
  previousRoomId: uuid("previous_room_id").references(() => rooms.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  room: one(rooms, {
    fields: [tenants.roomId],
    references: [rooms.id],
  }),
  previousRoom: one(rooms, {
    fields: [tenants.previousRoomId],
    references: [rooms.id],
  }),
  invoices: many(invoices),
  payments: many(paymentProofs),
}));

// --- PROPERTIES ---

export const buildings = pgTable("buildings", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g., "Building 1"
});

export const buildingsRelations = relations(buildings, ({ many }) => ({
  rooms: many(rooms),
}));

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g., "1-1"
  type: text("type").notNull(), // "Studio", "1 Bed + Bath"
  rent: decimal("rent", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // 'Vacant', 'Occupied', 'Maintenance'
  
  // Foreign Key
  buildingId: uuid("building_id").references(() => buildings.id).notNull(),
});

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  building: one(buildings, {
    fields: [rooms.buildingId],
    references: [buildings.id],
  }),
  tenants: many(tenants),
  invoices: many(invoices),
}));

// --- BILLING ---

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(), // e.g., INV-1001
  
  // Foreign Keys
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  unitId: uuid("unit_id").references(() => rooms.id).notNull(),

  // Periods (Stored as YYYY-MM)
  rentPeriod: text("rent_period").notNull(),
  utilityPeriod: text("utility_period").notNull(),

  // Meter Readings
  waterPrev: decimal("water_prev", { precision: 10, scale: 2 }).notNull(),
  waterCurr: decimal("water_curr", { precision: 10, scale: 2 }).notNull(),
  elecPrev: decimal("elec_prev", { precision: 10, scale: 2 }).notNull(),
  elecCurr: decimal("elec_curr", { precision: 10, scale: 2 }).notNull(),

  // Financial Breakdown
  rentAmount: decimal("rent_amount", { precision: 10, scale: 2 }).notNull(),
  waterCost: decimal("water_cost", { precision: 10, scale: 2 }).notNull(),
  elecCost: decimal("elec_cost", { precision: 10, scale: 2 }).notNull(),
  
  // Adjustments
  penalty: decimal("penalty", { precision: 10, scale: 2 }).default("0").notNull(),
  prevBalance: decimal("prev_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 10, scale: 2 }).default("0").notNull(),
  
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  status: text("status").notNull(), // 'Pending', 'Paid', 'Overdue'
  date: date("date").defaultNow().notNull(),
});

export const invoicesRelations = relations(invoices, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
  room: one(rooms, {
    fields: [invoices.unitId],
    references: [rooms.id],
  }),
  paymentProof: one(paymentProofs), // Optional link to a payment attempt
}));

export const paymentProofs = pgTable("payment_proofs", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Foreign Keys
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  invoiceId: uuid("invoice_id").references(() => invoices.id), // Optional: Payment might cover general balance
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Amount claimed paid
  receiptUrl: text("receipt_url").notNull(),
  message: text("message"),
  
  status: text("status").notNull(), // 'Pending', 'Verified', 'Rejected'
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const paymentProofsRelations = relations(paymentProofs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [paymentProofs.tenantId],
    references: [tenants.id],
  }),
  invoice: one(invoices, {
    fields: [paymentProofs.invoiceId],
    references: [invoices.id],
  }),
}));

// --- SETTINGS ---

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  electricityRate: decimal("electricity_rate", { precision: 10, scale: 2 }).default("21.00").notNull(),
  waterRate: decimal("water_rate", { precision: 10, scale: 2 }).default("70.00").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
