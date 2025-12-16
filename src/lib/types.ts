export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string | null;
  previousRoomId?: string | null;
  status: string;
  leaseEnd: string;
  deposit: number;
  previousRoom?: Unit | null;
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
  amountPaid?: number;
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
  rentPeriod: string;
  utilityPeriod: string;
  rent: number;
  water: number;
  elec: number;
  total: number;
  amountPaid?: number;
  status: string;
  date: string;
}
