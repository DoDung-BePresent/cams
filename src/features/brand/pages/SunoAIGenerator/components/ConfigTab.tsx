import { Row, Col } from 'antd';
import { SunoConfigForm } from '@/shared/modules/suno/components';

export const ConfigTab = () => {
  return (
    <Row gutter={[24, 24]}>
      <Col
        xs={24}
        lg={16}
      >
        <SunoConfigForm />
      </Col>
    </Row>
  );
};
