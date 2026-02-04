export type Branch = {
  id: string;
  store_id: string;
  branch_name: string;
  branch_code: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type CreateBranchPayload = {
  store_id: string;
  branch_name: string;
  branch_code: string;
  address: string;
};
