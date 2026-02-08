import type { Space } from '@/features/manager/types/spaceTypes';
import { DataTable } from '@/shared/components/common/DataTable';
import { getSpaceColumns } from './SpaceTableColumns';

type SpaceTableViewProps = {
  spaces: Space[];
  onEdit: (space: Space) => void;
  onDelete: (spaceId: string) => void;
};

export const SpaceTableView = ({
  spaces,
  onEdit,
  onDelete,
}: SpaceTableViewProps) => {
  const columns = getSpaceColumns({
    onEdit,
    onDelete,
  });

  return (
    <DataTable
      columns={columns}
      dataSource={spaces}
      rowKey='id'
    />
  );
};
