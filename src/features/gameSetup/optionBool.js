import { blue } from 'common/colors';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Switch } from 'react-native-paper';

const OptionBool = (props) => {
  const { option, setOption, readonly, index = 0 } = props;
  const [value, setValue] = useState(option.values[index].value === 'true');
  return (
    <Switch
      value={value}
      disabled={readonly}
      onValueChange={() => {
        console.log('value in onValueChange', value);
        let newOption = {
          name: option.name,
          values: option.values.map((v, i) => ({
            value: i === index ? (!value).toString() : v.value,
            holes: v.holes,
          })),
        };
        setOption(newOption);
        setValue(!value);
      }}
      color={blue}
      style={styles.switch}
    />
  );
};

export default OptionBool;

const styles = StyleSheet.create({
  switch: {
    marginVertical: 7,
  },
});
