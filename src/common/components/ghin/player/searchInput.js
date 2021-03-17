import React, { useContext, useEffect, useState, } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
  Input,
} from 'react-native-elements';
import { find } from 'lodash';

import { GhinPlayerSearchContext } from 'common/components/ghin/player/searchContext';
import CountryPicker from 'features/account/countryPicker';
import StatePicker from 'features/account/statePicker';
import { baseUri, scheme } from 'common/config';



const GhinPlayerSearchInput = props => {

  const { state, setState } = useContext(GhinPlayerSearchContext);

  const [ countries, setCountries ] = useState([]);

  useEffect(
    () => {
      const fetchData = async () => {
        const url = `${scheme}://${baseUri}/ghin/countries_and_states`;
        const res = await fetch(url, {
          method: 'GET',
        });
        const json = await res.json();
        //console.log('countries json', json);
        setCountries(json.countries);
      };
      fetchData();
    }, []
  );

  const c = find(countries, {code: state.country});
  let statelist = [];
  if( c && c.states ) statelist = c.states;

  //console.log('ghinPlayerSearch', ghinPlayerSearch);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.picker_country}>
          <CountryPicker
            countries={countries}
            selectedValue={state.country}
            onValueChange={(v) => setState({
              ...state,
              country: v,
            })}
          />
        </View>
        <View style={styles.picker_state}>
          <StatePicker
            states={statelist}
            selectedValue={state.state}
            onValueChange={(v) => setState({
              ...state,
              state: v,
            })}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.field}>
          <Input
            label='Last Name'
            labelStyle={styles.label}
            containerStyle={[styles.field_input, styles.last_name]}
            inputStyle={styles.field_input_txt}
            onChangeText={text => {
              setState({
                ...state,
                lastName: text,
              });
            }}
            autoCapitalize='words'
            value={state.lastName}
          />
        </View>
        <View style={styles.field}>
          <Input
            label='First Name (optional)'
            labelStyle={styles.label}
            containerStyle={styles.field_input}
            inputStyle={styles.field_input_txt}
            onChangeText={text => {
              setState({
                ...state,
                firstName: text,
              });
            }}
            autoCapitalize='words'
            value={state.firstName}
          />
        </View>
      </View>
    </View>
  );
};

export default GhinPlayerSearchInput;


const styles = StyleSheet.create({
  container: {
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  picker_country: {
    flex: 1,
    marginRight: 5,
  },
  picker_state: {
    flex: 1,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'normal',
  },
  field_input: {
    color: '#000',
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  last_name: {
    paddingRight: 5,
  },
  field_input_txt: {
    fontSize: 16,
  },
});