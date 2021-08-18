import { useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/core';
import { getHoles, isSameHolesList } from 'common/utils/game';
import { getNewGameForUpdate } from 'common/utils/game';
import { GameContext } from 'features/game/gameContext';
import { GET_GAME_QUERY } from 'features/game/graphql';
import { UPDATE_GAME_MUTATION } from 'features/game/graphql';
import OptionBool from 'features/gameSetup/optionBool';
import OptionDisplay from 'features/gameSetup/optionDisplay';
import OptionMenu from 'features/gameSetup/optionMenu';
import OptionNum from 'features/gameSetup/optionNum';
import OptionPct from 'features/gameSetup/optionPct';
import { findIndex } from 'lodash';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';

const Option = (props) => {
  const { item } = props;
  // console.log('option', item);

  const { game, readonly } = useContext(GameContext);
  const { _key: gkey } = game;
  const [updateGame] = useMutation(UPDATE_GAME_MUTATION);
  const navigation = useNavigation();

  const setOption = async (option) => {
    if (readonly) return; // view mode only, so don't allow changes
    const newOption = {
      name: option.name,
      values: option.values.map((v) => ({
        value: v.value,
        holes: v.holes,
      })),
    };
    // console.log('newOption', newOption);

    let newGame = getNewGameForUpdate(game);
    if (!newGame.options) newGame.options = [];
    const i = findIndex(newGame.options, { name: newOption.name });
    if (i < 0) newGame.options.push(newOption);
    if (i >= 0) newGame.options[i] = newOption;
    // console.log('setOption newGame', newGame);

    const { loading, error, data } = await updateGame({
      variables: {
        gkey: gkey,
        game: newGame,
      },
      refetchQueries: [
        {
          query: GET_GAME_QUERY,
          variables: {
            gkey: gkey,
          },
        },
      ],
    });
    if (error) console.log('Error setting option in game', error);
  };

  const getOptionComponent = (item) => {
    let ret = <OptionDisplay option={item} />;
    switch (item.sub_type) {
      case 'num':
        ret = <OptionNum option={item} setOption={setOption} readonly={readonly} />;
        break;
      case 'pct':
        ret = <OptionPct option={item} setOption={setOption} readonly={readonly} />;
        break;
      case 'bool':
        ret = <OptionBool option={item} setOption={setOption} readonly={readonly} />;
        break;
      case 'menu':
        ret = <OptionMenu option={item} setOption={setOption} readonly={readonly} />;
        break;
      default:
        break;
    }
    return ret;
  };
  const holes = item.values[0].holes || getHoles(game);
  const custom = !isSameHolesList(getHoles(game), holes);
  const content = custom ? (
    <Text
      onPress={async () => {
        navigation.navigate('OptionsCustom', { option: item, setOption });
      }}
    >
      custom
    </Text>
  ) : (
    getOptionComponent(item)
  );

  return (
    <View style={styles.field_container}>
      <Text style={styles.field_label}>{item.disp}</Text>
      <View style={styles.field_input_view}>{content}</View>
      <Icon
        name="dots-vertical"
        type="material-community"
        color="#999"
        size={32}
        onPress={async () => {
          navigation.navigate('OptionsCustom', { option: item, setOption });
        }}
      />
    </View>
  );
};

export default Option;

const styles = StyleSheet.create({
  field_container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field_input_view: {
    flex: 1,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  field_label: {
    marginTop: 5,
    marginBottom: 5,
    flex: 3,
  },
});
