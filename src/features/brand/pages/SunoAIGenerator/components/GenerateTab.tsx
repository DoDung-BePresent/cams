import { Card } from 'antd';

/**
 * Components
 */
import { SunoGenerationForm } from '@/shared/modules/suno/components';

interface GenerateTabProps {
  onSuccess: (generationId: string) => void;
}

export const GenerateTab = ({ onSuccess }: GenerateTabProps) => {
  return (
    <Card>
      <SunoGenerationForm onSuccess={onSuccess} />
    </Card>
  );
};
