import { useNavigation } from '@react-navigation/native';
import { blue } from 'common/colors';
import GhinSearchPlayer from 'common/components/ghin/player/search';
import BackToLogin from 'features/account/backToLogin';
import { RegisterContext } from 'features/account/registerContext';
import React, { useContext, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-elements';

const { width } = Dimensions.get('window');

const RegisterHandicap = () => {
  const { registration, setRegistration } = useContext(RegisterContext);
  const navigation = useNavigation();

  useEffect(() => {
    //console.log('registration', registration);
    if (registration.handicap?.id) {
      navigation.navigate('RegisterPlayer');
    }
  }, [navigation, registration]);

  return (
    <View style={styles.container}>
      <BackToLogin />
      <Card containerStyle={styles.card_container} wrapperStyle={styles.card_wrapper}>
        <Card.Title>Register - Handicap</Card.Title>
        <Card.Divider />
        <View style={styles.card_wrapper} testID="register_2_view">
          <GhinSearchPlayer state={registration} setState={setRegistration} />
          <View style={styles.divider}>
            <View style={styles.hrLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.hrLine} />
          </View>
        </View>
        <View style={styles.skip_view}>
          <Text>
            I don't keep a GHIN® handicap.
            <Text
              onPress={() => {
                navigation.navigate('RegisterPlayer');
              }}
              style={styles.skip_text}
            >
              {' '}
              Skip this step
            </Text>
          </Text>
        </View>
      </Card>
      <View style={styles.button_row}>
        <Button
          style={styles.prev}
          title="Prev"
          type="solid"
          onPress={async () => {
            // if going back, clear out ghinCreds
            await setRegistration({
              ...registration,
              ghinCreds: null,
            });
            navigation.goBack();
          }}
          accessibilityLabel="Register Prev 2"
          testID="register_prev_2_button"
        />
        <Button
          style={styles.next}
          title="Next"
          type={registration.ghinCreds ? 'solid' : 'outline'}
          disabled={!registration.ghinCreds}
          onPress={() => {
            navigation.navigate('RegisterPlayer');
          }}
          accessibilityLabel="Register Next 2"
          testID="register_next_2_button"
        />
      </View>
    </View>
  );
};

export default RegisterHandicap;

const styles = StyleSheet.create({
  button_row: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    padding: 15,
  },
  card_container: {
    flex: 11,
  },
  card_wrapper: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: '#b30000',
    flex: 12,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 5,
  },
  dividerText: {
    color: blue,
    textAlign: 'center',
    width: width / 8,
  },
  field_input: {
    color: '#000',
    fontSize: 16,
  },
  hrLine: {
    backgroundColor: blue,
    height: 1,
    width: width / 3.5,
  },
  next: {
    width: 150,
  },
  prev: {
    width: 150,
  },
  skip_text: {
    color: blue,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  skip_view: {
    justifyContent: 'flex-start',
    paddingBottom: 15,
    paddingHorizontal: 10,
  },
});
