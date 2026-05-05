import { SunoGenerationForm } from '@/shared/modules/suno/components';

interface GenerateTabProps {
  onSuccess: (generationId: string) => void;
}

export const GenerateTab = ({ onSuccess }: GenerateTabProps) => {
  return (
    <div style={{ width: '100%' }}>
      <SunoGenerationForm onSuccess={onSuccess} />
    </div>
  );
};
