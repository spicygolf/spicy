import { isBinary } from 'common/utils/game';
import React, { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { Button, Input } from 'react-native-elements';

const OptionAddValue = ({ option, addOptionValue }) => {
  const [newValue, setNewValue] = useState();
  let show = true;

  if (isBinary(option)) {
    show = false;
  }

  if (show) {
    return (
      <KeyboardAvoidingView>
        <View style={styles.row}>
          <Input
            label="Add Value"
            containerStyle={styles.inputContainer}
            onChangeText={(text) => setNewValue(text)}
            value={newValue}
          />
          <Button
            title="Add"
            containerStyle={styles.buttonContainer}
            onPress={() => {
              addOptionValue(newValue);
              setNewValue();
            }}
          />
        </View>
      </KeyboardAvoidingView>
    );
  } else {
    return null;
  }
};

export default OptionAddValue;

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
  },
  inputContainer: {
    flex: 4,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
});
