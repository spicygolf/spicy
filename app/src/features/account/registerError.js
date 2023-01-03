import { useNavigation } from '@react-navigation/native';
import BackToLogin from 'features/account/backToLogin';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-elements';

const RegisterError = (props) => {
  let error = {
    error: 500,
    message: 'Unknown error',
  };
  const { route } = props;
  //console.log('route', route);
  if (route && route.params && route.params.e) {
    error = route.params.e;
  }
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View>
        <Card>
          <Card.Title>Register - Error</Card.Title>
          <Card.Divider />
          <View testID="register_10000_view">
            <Text>{error.message}</Text>
          </View>
        </Card>
        <View style={styles.button_row}>
          <Button
            style={styles.prev}
            title="Prev"
            type="solid"
            onPress={() => {
              navigation.navigate('RegisterPlayer');
            }}
            accessibilityLabel="Register Prev 10000"
            testID="register_prev_10000_button"
          />
        </View>
      </View>
      <BackToLogin />
    </View>
  );
};

export default RegisterError;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#b30000',
    flex: 1,
  },
  changes: {
    paddingBottom: 20,
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
  prev: {
    width: 150,
  },
  next: {
    width: 150,
  },
});
