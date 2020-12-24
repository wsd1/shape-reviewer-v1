
import React from 'react';
import { Button, Space, Tag } from 'antd';


import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';

import ColorWidget from './rjsf/colorWidget';
import FieldTemplate from './rjsf/fieldTemplate';

//重写 ColorWidget, 原来的有错。参考：https://github.com/rjsf-team/react-jsonschema-form/blob/master/packages/antd/src/widgets/ColorWidget/index.js
Object.assign(AntDTheme.widgets, { ColorWidget });

//缺省的 antd  theme很丑，而且还没有description的渲染，所以重写 field 渲染，参见：https://react-jsonschema-form.readthedocs.io/en/latest/advanced-customization/custom-templates/
Object.assign(AntDTheme, { FieldTemplate });

const Form = withTheme(AntDTheme);

export default function FormConfig({ description, schema, uiSchema, defaultValue, value, saveValue }) {
    const formEl = React.useRef(null)

    return <Space direction="vertical">
        <Space>
            <Button onClick={() => { formEl.current.submit(); }} type="primary">应用配置</Button>
            <Button onClick={() => { saveValue(defaultValue); }}>恢复缺省</Button>
            <Tag color="#2db7f5">{description}</Tag>
        </Space>
        

        <div style={{ margin: "5px 20px", maxHeight: 800, overflow: "scroll" }}>
            <Form schema={schema}
                uiSchema={uiSchema}
                formData={value}
                //onChange={({ formData }) => setValue(formData)}
                onSubmit={({ formData }) => { saveValue(formData); }}
                //FieldTemplate={CustomFieldTemplate}
                ref={formEl}>
                <button type="submit" hidden={true}>我是个没用的提交按钮</button>
            </Form>
        </div>
    </Space>;
}


