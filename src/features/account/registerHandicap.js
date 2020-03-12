import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { find } from 'lodash';

import CountryPicker from 'features/account/countryPicker';
import StatePicker from 'features/account/statePicker';
import { validateName, validateInteger } from 'common/utils/account';
import { blue, green } from 'common/colors';
import { baseUrl } from 'common/config';

const { width } = Dimensions.get('window')



const RegisterHandicap = props => {

  const { registration, setRegistration } = props;
  const navigation = useNavigation();
  const lastNameRef = useRef(null);

  const [ lastNameValid, setLastNameValid ] = useState(false);
  const [ ghinNumberValid, setGhinNumberValid ] = useState(false);
  const [ countries, setCountries ] = useState([]);

  const validate = (type, text) => {

    const lnTest = type == 'name' ? text : registration.lastName;
    const gnTest = type == 'number' ? text : registration.ghinNumber;

    setLastNameValid(validateName(lnTest));
    setGhinNumberValid(validateInteger(gnTest));
  };

  const lnValid = { borderColor: lastNameValid ? green : '#ddd' };
  const gnValid = { borderColor: ghinNumberValid ? green : '#ddd' };

  useEffect(
    () => {
      if( lastNameRef && lastNameRef.current ) {
        lastNameRef.current.focus();
        validate();
      }
    }, [lastNameRef]
  );

  useEffect(
    () => {
      const fetchData = async () => {
        const url = `${baseUrl}/ghin/countries_and_states`;
        const res = await fetch(url, {
          method: 'GET',
        });
        const json = await res.json();
        setCountries(json.countries);
      };
      fetchData();
    }, []
  );

  const c = find(countries, {code: registration.country});
  let statelist = [];
  if( c && c.states ) statelist = c.states;

  return (
    <View style={styles.container}>
      <Card title='Handicap'>
        <View style={styles.loginView} testID='register_2_view'>
          <View>
            <View style={styles.field_container}>
              <Text style={styles.field_label}>Last Name *</Text>
              <TextInput
                style={[styles.field_input, lnValid]}
                onChangeText={text => {
                  setRegistration({
                    ...registration,
                    lastName: text,
                  });
                  validate('name', text);
                }}
                autoCapitalize='words'
                value={registration.lastName}
                ref={lastNameRef}
              />
            </View>
            <View style={styles.field_container}>
              <Text style={styles.field_label}>GHIN Number</Text>
              <TextInput
                style={[styles.field_input, gnValid]}
                onChangeText={text => {
                  setRegistration({
                    ...registration,
                    ghinNumber: text,
                  });
                  validate('number', text);
                }}
                autoCapitalize='none'
                value={registration.ghinNumber}
              />
            </View>
            <View style={styles.divider}>
              <View style={styles.hrLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.hrLine} />
            </View>
          </View>
          <View>
            <Text style={styles.lookup}>
              Look up my GHIN number by Last Name & State
            </Text>
            <View style={styles.states_row}>
              <View style={[styles.field_container, styles.picker_country]}>
                <Text style={styles.field_label}>Country</Text>
                <CountryPicker
                  countries={countries}
                  selectedValue={registration.country}
                  onValueChange={(v) => setRegistration({
                    ...registration,
                    country: v,
                  })}
                />
              </View>
              <View style={[styles.field_container, styles.picker_state]}>
                <Text style={styles.field_label}>State/Province</Text>
                <StatePicker
                  states={statelist}
                  selectedValue={registration.state}
                  onValueChange={(v) => setRegistration({
                    ...registration,
                    state: v,
                  })}
                />
              </View>
            </View>
          </View>
        </View>
      </Card>
      <View style={styles.button_row}>
        <Button
          style={styles.prev}
          title='Prev'
          type='solid'
          onPress={() => {
            navigation.navigate('Register', {c: registration.prev});
          }}
          accessibilityLabel='Register Prev 2'
          testID='register_prev_2_button'
        />
        <Button
          style={styles.next}
          title='Next'
          type={(lastNameValid && (ghinNumberValid || (registration.country && registration.state))) ? 'solid' : 'outline'}
          disabled={!(lastNameValid && (ghinNumberValid || (registration.country && registration.state)))}
          onPress={() => {
            setRegistration({
              ...registration,
              prev: 2,
            });
            navigation.navigate('Register', {c: 3})
          }}
          accessibilityLabel='Register Next 2'
          testID='register_next_2_button'
        />
      </View>
    </View>
  );
};

export default RegisterHandicap;


const styles = StyleSheet.create({
  container: {
  },
  field_label: {
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
  },
  field_input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
  },
  button_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  divider: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  hrLine: {
    width: width / 3.5,
    backgroundColor: blue,
    height: 1,
  },
  dividerText: {
    color: blue,
    textAlign: 'center',
    width: width / 8,
  },
  lookup: {
    paddingBottom: 15,
  },
  states_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  picker_country: {
    flex: 1,
    marginRight: 5,
  },
  picker_state: {
    flex: 1,
  },
  prev: {
    width: 150,
  },
  next: {
    width: 150,
  },
});