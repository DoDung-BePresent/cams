import { Select } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { useBranchStore } from '@/features/brand/stores/useBranchStore';

export const BranchSwitcher = () => {
  const currentBranch = useBranchStore((state) => state.currentBranch);
  const assignedBranches = useBranchStore((state) => state.assignedBranches);
  const switchBranch = useBranchStore((state) => state.switchBranch);

  // Hide if only one branch or no branches
  if (assignedBranches.length <= 1) return null;

  const options = assignedBranches.map((branch) => ({
    label: `${branch.branch_name} - ${branch.branch_code}`,
    value: branch.id,
  }));

  return (
    <Select
      value={currentBranch?.id}
      onChange={switchBranch}
      options={options}
      style={{ minWidth: 150, maxWidth: 200 }}
      placeholder='Select Branch'
      prefix={
        <ShopOutlined
          style={{
            fontSize: 16,
            marginRight: 4,
          }}
        />
      }
      styles={{
        popup: {
          root: {
            width: 'fit-width',
          },
        },
      }}
    />
  );
};
