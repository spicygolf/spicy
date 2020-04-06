import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Switch } from 'react-native-paper';

import { green } from 'common/colors';



const OptionBool = props => {

  const { option } = props;
  const [ value, setValue ] = useState(option.default == 'true');

  return (
    <View style={styles.field_container}>
      <Text style={styles.field_label}>{option.disp}</Text>
      <View style={styles.field_input_view}>
        <Switch
          value={value}
          onValueChange={() => setValue(!value)}
          color={green}
          style={styles.switch}
        />
      </View>
    </View>
  );
};

export default OptionBool;


const styles = StyleSheet.create({
  field_container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field_input_view: {
    flex: 1,
    alignItems: 'flex-end',
  },
  field_label: {
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
    flex: 3,
  },
  switch: {
    flex: 1,
    marginVertical: 7,
  },
});