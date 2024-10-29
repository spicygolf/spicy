import { green } from 'common/colors';
import { validateFloat } from 'common/utils/account';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

const OptionNum = (props) => {
  const { option, setOption, readonly, index = 0 } = props;
  const [value, setValue] = useState(option.values[0].value || null);

  const validate = useCallback(
    (type, text) => {
      const oTest = type === 'num' ? text : value;
      setOptionValid(validateFloat(oTest));
    },
    [value],
  );

  const [optionValid, setOptionValid] = useState(false);
  const oValid = { borderColor: optionValid ? green : '#ddd' };

  useEffect(() => validate(), [validate]);

  return (
    <TextInput
      editable={!readonly}
      style={[styles.field_input, oValid]}
      onChangeText={(text) => {
        setValue(text);
        validate('num', text);
      }}
      onEndEditing={() => {
        if (optionValid) {
          let newOption = {
            name: option.name,
            values: option.values.map((v, i) => ({
              value: i === index ? value.toString() : v.value,
              holes: v.holes,
            })),
          };
          setOption(newOption);
        }
      }}
      keyboardType="decimal-pad"
      value={value.toString()}
    />
  );
};

export default OptionNum;

const styles = StyleSheet.create({
  field_input: {
    borderColor: '#ccc',
    borderWidth: 1,
    color: '#000',
    flex: 1,
    height: 40,
    marginBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
});
