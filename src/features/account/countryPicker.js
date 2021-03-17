import React from 'react';
import {
  StyleSheet,
} from 'react-native';
import { Dropdown } from 'react-native-material-dropdown';
import { find } from 'lodash';



const CountryPicker = props => {

  const { countries, selectedValue, onValueChange } = props;

  let items = countries.map(country => ({
    value: country.name,
  }));

  const getValue = code => {
    const country = find(countries, {code: code});
    if( !country ) return '';
    return country.name;
  };

  const onChange = text => {
    const country = find(countries, {name: text});
    onValueChange(country.code);
  };

  return (
    <Dropdown
      value={getValue(selectedValue)}
      data={items}
      label='Country'
      onChangeText={text => {
        onChange(text);
      }}
    />
  );

};

export default CountryPicker;


const styles = StyleSheet.create({
});