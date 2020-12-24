//重写 ColorWidget, 原来的有错。参考：https://github.com/rjsf-team/react-jsonschema-form/blob/master/packages/antd/src/widgets/ColorWidget/index.js


import React from 'react';
import { Input } from 'antd';


const ColorWidget = ({
    // autofocus,
    disabled,
    formContext,
    id,
    // label,
    onBlur,
    onChange,
    onFocus,
    // options,
    placeholder,
    readonly,
    // required,
    // schema,
    value,
}) => {
    const { readonlyAsDisabled = true } = formContext;

    const handleChange = ({ target }) => onChange(target.value);
    const handleBlur = ({ target }) => onBlur(id, target.value);
    const handleFocus = ({ target }) => onFocus(id, target.value);

    return (
        <Input
            disabled={disabled || (readonlyAsDisabled && readonly)}
            id={id}
            name={id}
            onBlur={!readonly ? handleBlur : undefined}
            onChange={!readonly ? handleChange : undefined}
            onFocus={!readonly ? handleFocus : undefined}
            placeholder={placeholder}
            style={{ width: '100%' }}
            type="color"
            value={value}
        />
    );
};

export default ColorWidget;