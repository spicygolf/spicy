import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
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

import BackToLogin from 'features/account/backToLogin';
import { RegisterContext } from 'features/account/registerContext';
import CountryPicker from 'features/account/countryPicker';
import StatePicker from 'features/account/statePicker';
import { validateName, validateInteger } from 'common/utils/account';
import { blue, green } from 'common/colors';
import { baseUrl } from 'common/config';

const { width } = Dimensions.get('window')



const RegisterHandicap = props => {

  const { registration, setRegistration } = useContext(RegisterContext);
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
        //console.log('countries json', json);
        setCountries(json.countries);
      };
      fetchData();
    }, []
  );

  const c = find(countries, {code: registration.country});
  let statelist = [];
  if( c && c.states ) statelist = c.states;

  return (
    <KeyboardAvoidingView
      behavior={"padding"}
      style={styles.container}
      contentContainerStyle={{flex: 1,}}
    >
      <BackToLogin />
      <ScrollView>
        <Card title='Register - Handicap'>
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
            </View>
            <View style={styles.divider}>
                <View style={styles.hrLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.hrLine} />
              </View>
            <View>
              <Text style={styles.lookup}>
                Look up my GHIN number by Last Name & State
              </Text>
              <View style={styles.states_row}>
                <View style={[styles.field_container, styles.picker_country]}>
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
            <View style={styles.divider}>
                <View style={styles.hrLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.hrLine} />
              </View>
          </View>
          <View style={styles.skip_view}>
            <Text>
              I don't keep a GHIN handicap.
              <Text
                onPress={() => {
                  navigation.navigate('RegisterPlayer');
                }}
                style={styles.skip_text}
              >  Skip this step</Text>
            </Text>
          </View>
        </Card>
        <View style={styles.button_row}>
          <Button
            style={styles.prev}
            title='Prev'
            type='solid'
            onPress={() => {
              navigation.goBack();
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
              navigation.navigate('RegisterHandicapSearch')
            }}
            accessibilityLabel='Register Next 2'
            testID='register_next_2_button'
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterHandicap;


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#b30000',
    flex: 1,
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
    marginTop: 25,
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
  skip_view: {
    paddingBottom: 15,
    justifyContent: 'flex-start'
  },
  skip_text: {
    fontWeight: 'bold',
    marginLeft: 6,
    color: blue,
  },
  prev: {
    width: 150,
  },
  next: {
    width: 150,
  },
});