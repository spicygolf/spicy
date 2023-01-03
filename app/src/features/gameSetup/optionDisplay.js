import React from 'react';
import { Text, View } from 'react-native';

const OptionDisplay = (props) => {
  const { option } = props;

  return (
    <View>
      <Text>
        {option.name} - {option.values[0].value}
      </Text>
    </View>
  );
};

export default OptionDisplay;
