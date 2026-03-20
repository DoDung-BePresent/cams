import { Result, Button } from 'antd';
import { useNavigate } from 'react-router';

interface FeatureErrorFallbackProps {
  featureName?: string;
  onReset?: () => void;
}

/**
 * FeatureErrorFallback - Custom error fallback for feature-level errors
 * Shows a more specific error message with navigation options
 */
export const FeatureErrorFallback = ({
  featureName = 'this feature',
  onReset,
}: FeatureErrorFallbackProps) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ padding: '48px 24px', maxWidth: 600, margin: '0 auto' }}>
      <Result
        status='error'
        title={`Error loading ${featureName}`}
        subTitle='We encountered an error while loading this page. You can try going back or return to the home page.'
        extra={[
          <Button
            key='home'
            type='primary'
            size='large'
            onClick={handleGoHome}
          >
            Go Home
          </Button>,
          <Button
            key='back'
            size='large'
            onClick={handleGoBack}
          >
            Go Back
          </Button>,
          onReset && (
            <Button
              key='retry'
              size='large'
              onClick={onReset}
            >
              Try Again
            </Button>
          ),
        ]}
      />
    </div>
  );
};
