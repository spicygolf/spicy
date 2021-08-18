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
    let limit = -1;
    switch (option.type) {
      case 'bool':
        limit = 2;
        break;
      case 'menu':
        limit = option.choices.length;
        break;
    }
  };

  const renderCustomOption = ({ item }) => {
    console.log('value', item);
    return (
      <View style={styles.optionContainer}>
        <View style={styles.valueContainer}>
          <Text style={styles.label}>Value:</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
        <HoleChooser
          holes={item.holes || game.holes.map((h) => h.hole)}
          setHoles={() => null}
          title=""
          active={true}
        />
      </View>
    );
  };

  let limit = setLimit();

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
