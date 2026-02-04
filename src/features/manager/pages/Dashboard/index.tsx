import { useEffect } from 'react';
import { Typography, Spin } from 'antd';
import { useBranchStore } from '@/features/manager/stores/useBranchStore';
import type { Branch } from '@/features/admin/types/branchTypes';

const { Title } = Typography;

export const ManagerDashboard = () => {
  const currentBranch = useBranchStore((state) => state.currentBranch);
  const setAssignedBranches = useBranchStore(
    (state) => state.setAssignedBranches,
  );
  const isLoading = useBranchStore((state) => state.isLoading);
  const setLoading = useBranchStore((state) => state.setLoading);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        // TODO: Call API to get manager's assigned branches
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockBranches: Branch[] = [
          {
            id: '1',
            store_id: '1',
            branch_name: 'Highlands Coffee - District 1',
            branch_code: 'HLC_Q1',
            address: '123 Nguyen Hue, District 1, Ho Chi Minh City',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
          {
            id: '2',
            store_id: '1',
            branch_name: 'Highlands Coffee - District 3',
            branch_code: 'HLC_Q3',
            address: '456 Vo Van Tan, District 3, Ho Chi Minh City',
            created_at: '2024-01-16T10:00:00Z',
            updated_at: '2024-01-16T10:00:00Z',
          },
        ];

        setAssignedBranches(mockBranches);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [setAssignedBranches, setLoading]);

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Spin size='large' />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>
        {currentBranch
          ? `Dashboard - ${currentBranch.branch_name}`
          : 'Manager Dashboard'}
      </Title>
      <p>Welcome to Manager Dashboard</p>
      {currentBranch && (
        <div className='mt-4'>
          <p>
            <strong>Branch Code:</strong> {currentBranch.branch_code}
          </p>
          <p>
            <strong>Address:</strong> {currentBranch.address}
          </p>
        </div>
      )}
    </div>
  );
};
