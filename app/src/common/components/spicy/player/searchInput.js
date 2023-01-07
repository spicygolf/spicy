import { SpicyPlayerSearchContext } from 'common/components/spicy/player/searchContext';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { Input } from 'react-native-elements';

const SpicyPlayerSearchInput = (props) => {
  const { state, setState } = useContext(SpicyPlayerSearchContext);

  // console.log('SpicyPlayerSearchInput', state);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.field}>
          <Input
            placeholder="name"
            containerStyle={styles.field_input}
            inputStyle={styles.field_input_txt}
            onChangeText={(text) => {
              setState({
                ...state,
                search: text,
              });
            }}
            autoCapitalize="words"
            value={state.search}
          />
        </View>
      </View>
    </View>
  );
};

export default SpicyPlayerSearchInput;

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  field: {
    flex: 1,
  },
  field_input: {
    color: '#000',
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  field_input_txt: {
    fontSize: 16,
  },
  label: {
    color: '#999',
    fontSize: 12,
    fontWeight: 'normal',
  },
  picker_country: {
    flex: 1,
    marginRight: 5,
  },
  picker_state: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
});
