export type BranchStatus = 'active' | 'inactive';

export type Branch = {
  id: string;
  store_id: string;
  branch_name: string;
  branch_code: string;
  address: string;
  status: BranchStatus;
  created_at: string;
  updated_at: string;
};

export type CreateBranchDto = {
  store_id: string;
  branch_name: string;
  branch_code: string;
  address: string;
  status: BranchStatus;
};
