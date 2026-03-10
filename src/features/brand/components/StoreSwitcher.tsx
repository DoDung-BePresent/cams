import { useState, useEffect } from 'react';
import { Select, Typography } from 'antd';
import { ShopOutlined } from '@ant-design/icons';

/**
 * Hooks
 */
import { useStores } from '@/features/brand/hooks/useStores';

/**
 * Types
 */
import { EntityStatusEnum } from '@/shared/types/commonTypes';

const { Text } = Typography;

export const StoreSwitcher = () => {
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);

  // Fetch all active stores for the current brand manager
  const { data: storesData, isLoading } = useStores({
    pageSize: 100,
    status: EntityStatusEnum.Active,
  });

  // Initialize with first store
  useEffect(() => {
    if (storesData?.items && storesData.items.length > 0 && !currentStoreId) {
      setCurrentStoreId(storesData.items[0].id);
      // TODO: Save to context/zustand for global access
    }
  }, [storesData, currentStoreId]);

  const storeOptions =
    storesData?.items.map((store) => ({
      label: store.name,
      value: store.id,
    })) || [];

  const handleStoreChange = (storeId: string) => {
    setCurrentStoreId(storeId);
    // TODO: Update context/zustand
    console.log('Switched to store:', storeId);
  };

  if (isLoading || !storesData?.items || storesData.items.length === 0) {
    return null;
  }

  // If only one store, show as text instead of dropdown
  if (storesData.items.length === 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShopOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />
        <Text strong>{storesData.items[0].name}</Text>
      </div>
    );
  }

  return (
    <Select
      value={currentStoreId}
      onChange={handleStoreChange}
      options={storeOptions}
      style={{ minWidth: 200 }}
      placeholder='Select Store'
      suffixIcon={<ShopOutlined />}
      showSearch
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
    />
  );
};
