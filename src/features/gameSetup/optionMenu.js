import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Menu,
  Provider,
} from 'react-native-paper';
import { find } from 'lodash';

import { green } from 'common/colors';



const OptionMenu = props => {

  const { option } = props;
  const [ value, setValue ] = useState(option.default);
  const [ visible, setVisible ] = useState(false);

  const getDisplay = () => find(option.choices, {name: value}).disp;

  const choices = option.choices.map(choice => {
    return (
      <Menu.Item
        key={choice.name}
        onPress={() => {
          setValue(choice.name);
          setVisible(false);
        }}
        title={choice.disp}
      />
    );
  });

  return (
    <View style={styles.field_container}>
      <Text style={styles.field_label}>{option.disp}</Text>
      <View style={styles.field_input_view}>
        <View style={styles.menu_view}>
          <Menu
            style={styles.menu}
            visible={visible}
            anchor={
              <View style={styles.anchor_view}>
                <Text
                  style={styles.anchor}
                  onPress={() => setVisible(true)}
                >{getDisplay()}</Text>
              </View>
            }
            onDismiss={() => setVisible(false)}
          >
            { choices }
          </Menu>
        </View>
      </View>
    </View>
  );
};

export default OptionMenu;


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
  menu_view: {
    width: '100%',
  },
  anchor_view: {
    borderWidth: 1,
    borderColor: green,
    height: 40,
    width: '100%',
    justifyContent: 'center',
  },
  anchor: {
    padding: 5,
    marginRight: 1,
  },
});