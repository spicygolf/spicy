import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  validateFloat,
} from 'common/utils/account';
import { green } from 'common/colors';



const OptionNum = props => {

  const { option } = props;
  const [ value, setValue ] = useState(option.default || null);

  const validate = (type, text) => {
    const oTest = type == 'num' ? text : value;
    setOptionValid(validateFloat(oTest));
  };

  const [ optionValid, setOptionValid ] = useState(false);
  const oValid = { borderColor: optionValid ? green : '#ddd' };

  useEffect(
    () => validate(), []
  );

  return (
    <View style={styles.field_container}>
      <Text style={styles.field_label}>{option.disp}</Text>
      <View style={styles.field_input_view}>
        <TextInput
          style={[styles.field_input, oValid]}
          onChangeText={text => {
            setValue(text);
            validate('num', text);
          }}
          keyboardType='decimal-pad'
          value={value.toString()}
        />
      </View>
    </View>
  );
};

export default OptionNum;


const styles = StyleSheet.create({
  field_container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field_input_view: {
    flex: 1,
    justifyContent: 'center',
  },
  field_label: {
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
    flex: 3,
  },
  field_input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
    flex: 1,
  },
});