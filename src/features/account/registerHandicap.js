import React, { useContext, useEffect, } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

import BackToLogin from 'features/account/backToLogin';
import { RegisterContext } from 'features/account/registerContext';
import GhinSearchPlayer from 'common/components/ghin/player/search';
import { blue } from 'common/colors';

const { width } = Dimensions.get('window')



const RegisterHandicap = props => {

  const { registration, setRegistration } = useContext(RegisterContext);
  const navigation = useNavigation();

  useEffect(
    () => {
      //console.log('registration', registration);
      if( registration.ghinCreds ) {
        navigation.navigate('RegisterPlayer');
      }
    }, [registration]
  );


  return (
    <View style={styles.container}>
      <BackToLogin />
      <Card containerStyle={styles.card_container}>
        <Card.Title>Register - Handicap</Card.Title>
        <Card.Divider />
        <View style={styles.loginView} testID='register_2_view'>
          <GhinSearchPlayer
            state={registration}
            setState={setRegistration}
          />
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
          onPress={async () => {
            // if going back, clear out ghinCreds
            await setRegistration({
              ...registration,
              ghinCreds: null,
            });
            navigation.goBack();
          }}
          accessibilityLabel='Register Prev 2'
          testID='register_prev_2_button'
        />
        <Button
          style={styles.next}
          title='Next'
          type={(registration.ghinCreds) ? 'solid' : 'outline'}
          disabled={!(registration.ghinCreds)}
          onPress={() => {
            navigation.navigate('RegisterPlayer')
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
    backgroundColor: '#b30000',
    flex: 12,
  },
  card_container: {
    flex: 11,
  },
  field_input: {
    color: '#000',
    fontSize: 16,
  },
  button_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
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
    paddingHorizontal: 10,
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