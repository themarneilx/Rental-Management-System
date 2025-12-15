export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string | null;
  previousRoomId?: string | null; // New field for archived tenants
  status: string;
  leaseEnd: string;
  deposit: number;
  previousRoom?: Unit | null; // Include previous room details
  // keeping these for compatibility if needed, but primary structure follows design.jsx
  idPhoto?: string;
  contract?: string;
  avatarUrl?: string | null;
  contractUrl?: string | null;
}

export interface Unit {
  id: string;
  name: string;
  building: string;
  type: string;
  rent: number;
  status: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  unitId: string;
  rentPeriod: string;
  utilityPeriod: string;
  rent: number;
  waterReading: { prev: number; curr: number };
  elecReading: { prev: number; curr: number };
  waterCost: number;
  elecCost: number;
  penalty: number;
  prevBalance: number;
  total: number;
  status: string;
  date: string;
  amountPaid?: number; // Optional property for tracking partial payments
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined: string;
  avatarUrl?: string | null;
}

// Tenant Portal Specific Types
export interface TenantUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string;
  unitName: string;
  building: string;
  leaseEnd: string;
  avatar: string | null;
  contractUrl?: string | null;
}

export interface TenantInvoice {
  id: string;
  period: string;
  rent: number;
  water: number;
  elec: number;
  total: number;
  amountPaid?: number; // Added for tenant view
  status: string;
  date: string;
}

export const INITIAL_TENANTS: Tenant[] = [
  { id: 'T-001', name: 'Jane Smith', email: 'jane@example.com', phone: '+63 917 123 4567', unitId: 'U-101', status: 'Active', leaseEnd: '2025-12-31', deposit: 10000 },
  { id: 'T-002', name: 'John Doe', email: 'john@example.com', phone: '+63 918 987 6543', unitId: 'U-201', status: 'Active', leaseEnd: '2025-11-30', deposit: 12000 },
  { id: 'T-003', name: 'Robert Brown', email: 'rob@example.com', phone: '+63 919 555 1234', unitId: 'U-202', status: 'Active', leaseEnd: '2026-01-15', deposit: 9500 },
  { id: 'T-004', name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+63 920 444 9999', unitId: null, status: 'Archived', leaseEnd: '2024-10-01', deposit: 0 },
];

export const INITIAL_UNITS: Unit[] = [
  { id: 'U-101', name: '1-1', building: 'Building 1', type: '3BHK', rent: 18000, status: 'Occupied' },
  { id: 'U-201', name: '2-1', building: 'Building 2', type: '2BHK', rent: 12000, status: 'Occupied' },
  { id: 'U-102', name: '1-2', building: 'Building 1', type: '2BHK', rent: 11000, status: 'Vacant' },
  { id: 'U-202', name: '2-2', building: 'Building 2', type: '1BHK', rent: 9500, status: 'Occupied' },
  { id: 'U-103', name: '1-3', building: 'Building 1', type: 'Studio', rent: 8000, status: 'Maintenance' },
];

// @ts-ignore
export const INITIAL_INVOICES: Invoice[] = [
  { 
    id: 'INV-001', 
    tenantId: 'T-001', 
    unitId: 'U-101', 
    rentPeriod: '2025-01',
    utilityPeriod: '2025-01',
    rent: 18000, 
    waterReading: { prev: 100, curr: 106.5 },
    elecReading: { prev: 1200, curr: 1257.2 },
    waterCost: 455, 
    elecCost: 1201.2, 
    penalty: 0, 
    prevBalance: 0,
    // @ts-ignore
    credit: 0, 
    total: 19656.2, 
    status: 'Paid', 
    date: '2025-01-05' 
  },
  { 
    id: 'INV-002', 
    tenantId: 'T-002', 
    unitId: 'U-201', 
    rentPeriod: '2025-01',
    utilityPeriod: '2025-01',
    rent: 12000, 
    waterReading: { prev: 50, curr: 54.3 },
    elecReading: { prev: 800, curr: 842.8 },
    waterCost: 301, 
    elecCost: 898.8, 
    penalty: 500, 
    prevBalance: 0,
    // @ts-ignore
    credit: 0, 
    total: 13699.8, 
    status: 'Overdue', 
    date: '2025-01-01' 
  },
  { 
    id: 'INV-003', 
    tenantId: 'T-003', 
    unitId: 'U-202', 
    rentPeriod: '2025-02',
    utilityPeriod: '2025-02',
    rent: 9500, 
    waterReading: { prev: 20, curr: 22.8 },
    elecReading: { prev: 400, curr: 430.9 },
    waterCost: 196, 
    elecCost: 648.9, 
    penalty: 0, 
    prevBalance: 100,
    // @ts-ignore
    credit: 0, 
    total: 10444.9, 
    status: 'Pending', 
    date: '2025-02-01' 
  },
];

export const INITIAL_ADMINS: Admin[] = [
  { id: 'A-001', name: 'Super Admin', email: 'admin@nicarjon.com', role: 'Super Admin', status: 'Active', joined: 'Jan 15, 2022' },
  { id: 'A-002', name: 'Mike Manager', email: 'mike@nicarjon.com', role: 'Property Manager', status: 'Active', joined: 'Mar 22, 2023' },
];

// Tenant Portal Mock Data
export const MOCK_TENANT_USER: TenantUser = {
  id: 'T-001',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+63 917 123 4567',
  unitId: 'U-101',
  unitName: '1-1',
  building: 'Building 1',
  leaseEnd: '2025-12-31',
  avatar: null 
};

export const MOCK_TENANT_INVOICES: TenantInvoice[] = [
  { id: 'INV-001', period: 'Jan 2025', rent: 18000, water: 455, elec: 1201.2, total: 19656.2, status: 'Paid', date: '2025-01-05' },
  { id: 'INV-004', period: 'Feb 2025', rent: 18000, water: 0, elec: 0, total: 18000, status: 'Pending', date: '2025-02-01' },
];