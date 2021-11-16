import HoleChooser from 'common/components/holeChooser';
import { GameContext } from 'features/game/gameContext';
import GameNav from 'features/games/gamenav';
import React, { useContext } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const OptionsCustom = (props) => {
  const { route } = props;
  const { params } = route;
  const { option, setOption } = params;
  // console.log('option', option);
  const { game } = useContext(GameContext);

  const setLimit = () => {
    let lim = -1;
    switch (option.type) {
      case 'bool':
        lim = 2;
        break;
      case 'menu':
        lim = option.choices.length;
        break;
    }
    return lim;
  };

  const setHoles = ({ item, hole, newValue, newHoles }) => {
    console.log('setHoles', item, hole, newValue, newHoles, option);
    // Check option.sub_type - if bool, we need to flip another hole to the other value

    // Check option.sub_type - if menu, we need to flip another hole, right?

    // maybe instead of the above two options, we go through the entire option
    // and see if the hole in question has a value otherwise and adjust from there?

    // goal is to build an entire game.options[ option ] thing to mutate.
  };

  const renderCustomOption = ({ item }) => {
    const onChange = ({ hole, newValue, newHoles }) => {
      setHoles({ item, hole, newValue, newHoles });
    };

    return (
      <View style={styles.optionContainer}>
        <View style={styles.valueContainer}>
          <Text style={styles.label}>Value:</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
        <HoleChooser
          holes={item.holes || game.holes.map((h) => h.hole)}
          onChange={onChange}
          title=""
          active={true}
        />
      </View>
    );
  };

  let limit = setLimit();
  console.log('lint holders', limit, setOption);

  return (
    <View style={styles.container}>
      <GameNav title="Customize Options" showBack={true} backTo={'GameSetup'} />
      <View style={styles.title}>
        <Text>Option:</Text>
        <Text style={styles.name}>{option.disp}</Text>
      </View>
      <FlatList
        data={option.values}
        renderItem={renderCustomOption}
        keyExtractor={(o) => o.value}
      />
    </View>
  );
};

export default OptionsCustom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    alignSelf: 'center',
    paddingVertical: 10,
    flexDirection: 'row',
  },
  name: {
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  optionContainer: {
    paddingVertical: 10,
  },
  valueContainer: {
    flexDirection: 'row',
  },
  label: {
    paddingRight: 10,
  },
  value: {
    fontWeight: 'bold',
  },
});
