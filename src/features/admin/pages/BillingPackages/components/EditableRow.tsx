import React from 'react';
import { Form } from 'antd';
import { EditableContext } from './EditableCell';

interface EditableRowProps {
  index: number;
}

export const EditableRow: React.FC<React.PropsWithChildren<EditableRowProps>> =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
      <Form
        form={form}
        component={false}
      >
        <EditableContext.Provider value={form}>
          <tr {...props} />
        </EditableContext.Provider>
      </Form>
    );
  };
