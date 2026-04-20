import React, { useContext, useEffect, useRef, useState } from 'react';
import { Form, Input, InputNumber } from 'antd';
import type { InputRef } from 'antd';
import type { BillingPackageItem } from '@/shared/modules/billing';

type FormInstance = ReturnType<typeof Form.useForm>[0];

// eslint-disable-next-line react-refresh/only-export-components
export const EditableContext = React.createContext<FormInstance | null>(null);

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: keyof BillingPackageItem;
  inputType?: 'text' | 'number';
  step?: number;
  record: BillingPackageItem & { key: string };
  handleSave: (record: BillingPackageItem & { key: string }) => void;
  children: React.ReactNode;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  inputType = 'text',
  step,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
          ...(inputType === 'number'
            ? [
                {
                  type: 'number' as const,
                  min: 1,
                  message: 'Must be greater than 0',
                },
              ]
            : []),
        ]}
      >
        {inputType === 'number' ? (
          <InputNumber
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={inputRef as any}
            onPressEnter={save}
            onBlur={save}
            style={{ width: '100%' }}
            min={1}
            step={step || 1}
          />
        ) : (
          <Input
            ref={inputRef}
            onPressEnter={save}
            onBlur={save}
          />
        )}
      </Form.Item>
    ) : (
      <div
        className='editable-cell-value-wrap'
        style={{
          paddingInlineEnd: 24,
          minHeight: 32,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};
