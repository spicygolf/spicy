import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Menu,
} from 'react-native-paper';
import { find } from 'lodash';

import { green } from 'common/colors';



const OptionMenu = props => {

  const { option, setOption, readonly, index = 0 } = props;
  const [ value, setValue ] = useState(option.values[0].value);
  const [ visible, setVisible ] = useState(false);

  const getDisplay = () => find(option.choices, {name: value}).disp;

  const choices = option.choices.map(choice => {
    return (
      <Menu.Item
        key={choice.name}
        onPress={() => {
          setValue(choice.name);
          let newOption = {
            name: option.name,
            values: option.values.map((v, i) => ({
              value: (i === index)
                ? choice.name
                : v.value,
              holes: v.holes,
            })),
          };
          setOption(newOption);
          setVisible(false);
        }}
        title={choice.disp}
      />
    );
  });

  const menuContent = readonly
    ? (<Text>{getDisplay()}</Text>)
    : (
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
      );

  return (
    <View style={styles.menu_view}>
      { menuContent }
    </View>
  );

};

export default OptionMenu;


const styles = StyleSheet.create({
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