import { Skeleton } from 'antd';
import type { CSSProperties } from 'react';

type FormSkeletonProps = {
  /** Number of input fields to show */
  inputCount?: number;
  /** Show image upload skeleton */
  showImage?: boolean;
  /** Additional text area rows */
  textAreaRows?: number;
  /** Custom container style */
  style?: CSSProperties;
};

export const FormSkeleton = ({
  inputCount = 2,
  showImage = true,
  textAreaRows = 3,
  style,
}: FormSkeletonProps) => {
  return (
    <div style={{ padding: '24px 0', ...style }}>
      {/* Input fields */}
      {Array.from({ length: inputCount }).map((_, index) => (
        <Skeleton.Input
          key={`input-${index}`}
          active
          block
          style={{ marginBottom: 24, height: 32 }}
        />
      ))}

      {/* Text area */}
      <Skeleton
        active
        paragraph={{ rows: textAreaRows }}
        style={{ marginBottom: 24 }}
      />

      {/* Image upload */}
      {showImage && (
        <Skeleton.Image
          active
          style={{
            width: '100%',
            height: 200,
            marginBottom: 24,
          }}
        />
      )}

      {/* Additional fields */}
      <Skeleton
        active
        paragraph={{ rows: 6 }}
      />
    </div>
  );
};
