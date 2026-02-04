import { Modal } from 'antd';
import type { ModalFuncProps } from 'antd';
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  DeleteFilled,
} from '@ant-design/icons';

type AppModalProps = ModalFuncProps & {
  blur?: boolean;
};

const baseModalConfig: ModalFuncProps = {
  centered: true,
  okButtonProps: {
    size: 'large',
    style: {
      fontSize: 14,
      borderRadius: 4,
      width: '49%',
    },
  },
  cancelButtonProps: {
    size: 'large',
    style: {
      fontSize: 14,
      borderRadius: 4,
      width: '49%',
    },
  },
  classNames: {
    body: 'static-modal-body',
  },
  styles: {
    mask: {
      backdropFilter: 'blur(4px)',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    body: {
      textAlign: 'center',
    },
    footer: {
      marginTop: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  },
  width: 480,
  mask: {
    blur: false,
  },
};

// app Confirm Modal
const appConfirm = (props: AppModalProps) => {
  return Modal.confirm({
    ...baseModalConfig,
    ...props,
    icon: props.icon ?? (
      <div className='mx-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-100'>
        <DeleteFilled style={{ fontSize: 32, color: '#ff4d4f' }} />
      </div>
    ),
    okText: props.okText || 'Confirm',
    cancelText: props.cancelText || 'Cancel',
    okButtonProps: {
      ...baseModalConfig.okButtonProps,
      ...props.okButtonProps,
    },
    cancelButtonProps: {
      ...baseModalConfig.cancelButtonProps,
      ...props.cancelButtonProps,
    },
  });
};

// app Success Modal
const appSuccess = (props: AppModalProps) => {
  return Modal.success({
    ...baseModalConfig,
    ...props,
    icon: props.icon ?? (
      <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
    ),
    okText: props.okText || 'OK',
    okButtonProps: {
      ...baseModalConfig.okButtonProps,
      ...props.okButtonProps,
      type: 'primary',
    },
  });
};

// app Error Modal
const appError = (props: AppModalProps) => {
  return Modal.error({
    ...baseModalConfig,
    ...props,
    icon: props.icon ?? (
      <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
    ),
    okText: props.okText || 'OK',
    okButtonProps: {
      ...baseModalConfig.okButtonProps,
      ...props.okButtonProps,
      danger: true,
    },
  });
};

// app Warning Modal
const appWarning = (props: AppModalProps) => {
  return Modal.warning({
    ...baseModalConfig,
    ...props,
    icon: props.icon ?? (
      <ExclamationCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
    ),
    okText: props.okText || 'OK',
    okButtonProps: {
      ...baseModalConfig.okButtonProps,
      ...props.okButtonProps,
    },
  });
};

// app Info Modal
const appInfo = (props: AppModalProps) => {
  return Modal.info({
    ...baseModalConfig,
    ...props,
    icon: props.icon ?? (
      <InfoCircleOutlined style={{ fontSize: 24, color: '#1677ff' }} />
    ),
    okText: props.okText || 'OK',
    okButtonProps: {
      ...baseModalConfig.okButtonProps,
      ...props.okButtonProps,
    },
  });
};

// Export all as a single object (similar to Modal.confirm, Modal.error, etc.)
export const AppModal = {
  confirm: appConfirm,
  success: appSuccess,
  error: appError,
  warning: appWarning,
  info: appInfo,
};
