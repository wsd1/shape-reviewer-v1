//重写 RangeWidget, 做了tips的支持。参考：https://github.com/rjsf-team/react-jsonschema-form/blob/master/packages/antd/src/widgets/RangeWidget/index.js

import React from 'react';
import { Slider } from 'antd';

import { utils } from '@rjsf/core';

const { rangeSpec } = utils;

const RangeWidget = ({
  autofocus,
  disabled,
  formContext,
  id,
  // label,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  readonly,
  // required,
  schema,
  value,
}) => {
  const { readonlyAsDisabled = true } = formContext;

  const { min, max, step } = rangeSpec(schema);

  const emptyValue = options.emptyValue || '';

  const handleChange = (nextValue) =>
    onChange(nextValue === '' ? emptyValue : nextValue);

  const handleBlur = () => onBlur(id, value);

  const handleFocus = () => onFocus(id, value);

  return (
    <Slider
      autoFocus={autofocus}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      max={max}
      min={min}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      range={false}
      step={step}
      value={value}
      tooltipVisible={true}
    />
  );
};

export default RangeWidget;