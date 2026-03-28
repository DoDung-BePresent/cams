import { Row, Col } from 'antd';

/**
 * Components
 */
import {
  SunoGenerationForm,
  SunoPromptHistory,
} from '@/shared/modules/suno/components';

interface GenerateTabProps {
  onSuccess: (generationId: string) => void;
}

export const GenerateTab = ({ onSuccess }: GenerateTabProps) => {
  return (
    <Row gutter={[24, 24]}>
      <Col
        xs={24}
        lg={12}
      >
        <SunoGenerationForm onSuccess={onSuccess} />
      </Col>
      <Col
        xs={24}
        lg={12}
      >
        <SunoPromptHistory pageSize={10} />
      </Col>
    </Row>
  );
};
