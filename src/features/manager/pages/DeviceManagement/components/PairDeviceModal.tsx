import { useState, useEffect } from 'react';
import {
  Button,
  Divider,
  Flex,
  Form,
  Radio,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import { QRCode } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type {
  PairDevicePayload,
  PairingMethod,
  QRCodePayload,
} from '@/features/manager/types/deviceTypes';
import { pairDeviceValidation } from '@/features/manager/validations/deviceValidation';
import { useBranchStore } from '@/features/manager/stores/useBranchStore';
import {
  PAIRING_CODE_EXPIRY_MINUTES,
  QR_CODE_EXPIRY_MINUTES,
} from '@/features/manager/constants/deviceConstants';
import { AppModal } from '@/shared/components/ui/AppModal';

const { Text, Title } = Typography;

type PairDeviceModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export const PairDeviceModal = ({
  open,
  onClose,
  onSuccess,
}: PairDeviceModalProps) => {
  const [form] = Form.useForm<PairDevicePayload>();
  const [loading, setLoading] = useState(false);
  const [pairingMethod, setPairingMethod] =
    useState<PairingMethod>('pairing_code');
  const [generatedCode, setGeneratedCode] = useState('');
  const [qrPayload, setQrPayload] = useState<QRCodePayload | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const currentBranch = useBranchStore((state) => state.currentBranch);

  // Mock spaces - TODO: Fetch from API
  const spaces = [
    { label: 'Main Floor', value: '1' },
    { label: 'VIP Area', value: '2' },
    { label: 'Outdoor Seating', value: '3' },
  ];

  // Generate pairing code
  const generatePairingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
    setGeneratedCode(code);
    setExpiresAt(
      new Date(Date.now() + PAIRING_CODE_EXPIRY_MINUTES * 60 * 1000),
    );
  };

  // Generate QR code
  const generateQRCode = () => {
    const payload: QRCodePayload = {
      space_id: form.getFieldValue('space_id') || '',
      device_token: `TOKEN_${Date.now()}`,
      api_endpoint: 'https://api.cams.com/device/register',
      expires_at: new Date(
        Date.now() + QR_CODE_EXPIRY_MINUTES * 60 * 1000,
      ).toISOString(),
    };
    setQrPayload(payload);
    setExpiresAt(new Date(payload.expires_at));
  };

  // Auto-generate on method change
  useEffect(() => {
    if (open) {
      if (pairingMethod === 'pairing_code') {
        generatePairingCode();
      } else {
        const spaceId = form.getFieldValue('space_id');
        if (spaceId) {
          generateQRCode();
        }
      }
    }
  }, [pairingMethod, open]);

  const handleSubmit = async (values: PairDevicePayload) => {
    try {
      setLoading(true);

      const payload: PairDevicePayload = {
        ...values,
        pairing_method: pairingMethod,
        pairing_code:
          pairingMethod === 'pairing_code' ? generatedCode : undefined,
      };

      console.log('Pair device:', payload);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('Device paired successfully!');
      onSuccess();
      form.resetFields();
      setGeneratedCode('');
      setQrPayload(null);
      onClose();
    } catch (error) {
      message.error('Failed to pair device!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setGeneratedCode('');
    setQrPayload(null);
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    message.success('Pairing code copied to clipboard!');
  };

  const remainingTime = expiresAt
    ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60))
    : 0;

  return (
    <AppModal
      title='Pair Device'
      open={open}
      onCancel={handleCancel}
      width={600}
      maxHeight='70vh'
      scrollable={true}
      footer={
        <Flex
          justify='end'
          gap='small'
        >
          <Button
            size='large'
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size='large'
            type='primary'
            onClick={() => form.submit()}
            loading={loading}
          >
            Confirm Pairing
          </Button>
        </Flex>
      }
    >
      <Form
        form={form}
        size='large'
        layout='vertical'
        onFinish={handleSubmit}
        initialValues={{
          pairing_method: 'pairing_code',
        }}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Form.Item
          label='Select Space'
          name='space_id'
          rules={pairDeviceValidation.space_id}
        >
          <Select
            placeholder='Choose space to assign device'
            options={spaces}
            onChange={() => {
              if (pairingMethod === 'qr_code') {
                generateQRCode();
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label='Pairing Method'
          name='pairing_method'
        >
          <Radio.Group
            onChange={(e) => setPairingMethod(e.target.value)}
            value={pairingMethod}
          >
            <Radio.Button value='pairing_code'>
              6-Digit Code (ESP32)
            </Radio.Button>
            <Radio.Button value='qr_code'>QR Code (Android)</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Divider />

        {pairingMethod === 'pairing_code' && (
          <Flex
            vertical
            align='center'
            gap={16}
          >
            <Title
              level={4}
              className='mb-0!'
            >
              Pairing Code
            </Title>
            <Flex
              align='center'
              gap={8}
            >
              <div className='rounded-lg bg-gray-100 px-8 py-4'>
                <Text
                  className='font-mono! text-3xl!'
                  strong
                >
                  {generatedCode}
                </Text>
              </div>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyCode}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={generatePairingCode}
              />
            </Flex>
            <Space
              direction='vertical'
              align='center'
              size={4}
            >
              <Text type='secondary'>Enter this code on your ESP32 device</Text>
              <Text type='warning'>⏱ Expires in: {remainingTime} minutes</Text>
            </Space>
          </Flex>
        )}

        {pairingMethod === 'qr_code' && qrPayload && (
          <Flex
            vertical
            align='center'
            gap={16}
          >
            <Title
              level={4}
              className='mb-0!'
            >
              Scan QR Code
            </Title>
            <QRCode
              value={JSON.stringify(qrPayload)}
              size={200}
              bordered
            />
            <Space
              direction='vertical'
              align='center'
              size={4}
            >
              <Text type='secondary'>
                Scan with your Android app to pair device
              </Text>
              <Text type='warning'>⏱ Expires in: {remainingTime} minutes</Text>
              <Button
                icon={<ReloadOutlined />}
                onClick={generateQRCode}
              >
                Regenerate QR Code
              </Button>
            </Space>
          </Flex>
        )}
      </Form>
    </AppModal>
  );
};
