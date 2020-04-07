import React from 'react';
import {
  Text,
  View,
} from 'react-native';



const OptionDisplay = props => {

  const { option } = props;

  return (
    <View>
      <Text>{option.name} - {option.value}</Text>
    </View>
  );
};

export default OptionDisplay;