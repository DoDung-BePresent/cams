import { Row, Col } from 'antd';

/**
 * Components
 */
import { SunoGenerationForm } from '@/shared/modules/suno/components';

interface GenerateTabProps {
  onSuccess: (generationId: string) => void;
}

export const GenerateTab = ({ onSuccess }: GenerateTabProps) => {
  return (
    <Row gutter={[24, 24]}>
      <Col
        xs={24}
        lg={16}
      >
        <SunoGenerationForm onSuccess={onSuccess} />
      </Col>
    </Row>
  );
};
