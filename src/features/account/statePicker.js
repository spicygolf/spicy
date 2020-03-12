import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
} from 'react-native';
import { Icon } from 'react-native-elements';
import RNPickerSelect from 'react-native-picker-select';



const StatePicker = props => {

  const { states, selectedValue, onValueChange } = props;

  let items = states.map(state => ({
    label: state.name,
    value: state.code
  }));

  //console.log('state picker render');

  return (
    <RNPickerSelect
      style={styles}
      value={selectedValue}
      onValueChange={onValueChange}
      items={items}
      Icon={() => (
        <Icon
          name='arrow-drop-down'
          type='material'
          color='#ddd'
          size={30}
        />
      )}
    />
  );

};

export default StatePicker;


const styles = StyleSheet.create({
  inputIOS: {
    paddingVertical: 7,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    paddingHorizontal: 7,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: '#ddd',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
});