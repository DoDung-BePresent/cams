import { Upload, message } from 'antd';
import type { UploadFile, UploadProps, RcFile } from 'antd/es/upload/interface';

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
] as const;

/**
 * Max file size: 5MB
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Accept attribute for Upload component
 */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

/**
 * Validate image file type
 */
export const validateImageType = (file: File): boolean => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    message.error(
      'File must be an image (jpg, jpeg, png, gif, webp, bmp, svg)',
    );
    return false;
  }
  return true;
};

/**
 * Validate image file size
 */
export const validateImageSize = (
  file: File,
  maxSize = MAX_IMAGE_SIZE,
): boolean => {
  if (file.size > maxSize) {
    message.error(`File size must not exceed ${maxSize / (1024 * 1024)}MB`);
    return false;
  }
  return true;
};

/**
 * Complete image validation
 */
export const validateImageFile = (file: File): boolean => {
  return validateImageType(file) && validateImageSize(file);
};

/**
 * Create upload props for image dragger
 */
export const createImageUploadProps = <T extends Record<string, any>>(
  onFileChange: (file: UploadFile | null) => void,
  onFormFieldChange?: (fieldName: keyof T, value: any) => void, // ✅ Keep generic string type
): UploadProps => ({
  maxCount: 1,
  beforeUpload: (file: RcFile) => {
    // ✅ Use RcFile instead of File
    if (!validateImageFile(file)) {
      return Upload.LIST_IGNORE;
    }

    // ✅ RcFile already has uid property
    onFileChange({
      uid: file.uid,
      name: file.name,
      originFileObj: file,
    } as UploadFile);

    return false; // Prevent auto upload
  },
  onRemove: () => {
    onFileChange(null);
    if (onFormFieldChange) {
      onFormFieldChange('logo', undefined);
    }
  },
  accept: IMAGE_ACCEPT,
  listType: 'picture',
});
