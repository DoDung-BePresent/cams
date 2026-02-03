export type BusinessType = 'cafe' | 'retail' | 'restaurant' | 'other';

export type StoreStatus = 'active' | 'inactive';

export type Store = {
  id: string;
  store_name: string;
  business_type: BusinessType;
  description?: string;
  manager_emails: string[];
  status: StoreStatus;
  created_at: string;
  updated_at: string;
};

export type CreateStoreDto = {
  store_name: string;
  business_type: BusinessType;
  description?: string;
  manager_emails: string[];
  status: StoreStatus;
};
