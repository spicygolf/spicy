import { find } from 'lodash';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-material-dropdown';

const StatePicker = (props) => {
  const { states, selectedValue, onValueChange } = props;

  let items = states.map((state) => ({
    value: state.name,
  }));

  const getValue = (code) => {
    const state = find(states, { code: code });
    if (!state) return '';
    return state.name;
  };

  const onChange = (text) => {
    const state = find(states, { name: text });
    onValueChange(state.code);
  };

  return (
    <Dropdown
      value={getValue(selectedValue)}
      data={items}
      label="State/Territory"
      pickerStyle={styles.picker}
      onChangeText={(text) => {
        onChange(text);
      }}
    />
  );
};

export default StatePicker;

const styles = StyleSheet.create({
  picker: {
    height: '50%',
  },
});
