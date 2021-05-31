import React, { useContext } from 'react';
import {
  FlatList,
  Text,
  View,
} from 'react-native';
import { Card } from 'react-native-elements';
import { useMutation } from '@apollo/client';
import { findIndex } from 'lodash';

import { GameContext } from 'features/game/gameContext';
import { getAllOptions } from 'common/utils/game';
import { getNewGameForUpdate } from 'common/utils/game';
import { GET_GAME_QUERY } from 'features/game/graphql';
import { UPDATE_GAME_MUTATION } from 'features/game/graphql';
import OptionDisplay from 'features/gameSetup/optionDisplay';
import OptionNum from 'features/gameSetup/optionNum';
import OptionPct from 'features/gameSetup/optionPct';
import OptionBool from 'features/gameSetup/optionBool';
import OptionMenu from 'features/gameSetup/optionMenu';



const Options = props => {

  const { game, readonly } = useContext(GameContext);
  const { _key: gkey } = game;
  const allOptions = getAllOptions(game);

  const [ updateGame ] = useMutation(UPDATE_GAME_MUTATION);

  const setOption = async option => {
    if( readonly ) return; // view mode only, so don't allow changes
    const newOption = {
      name: option.name,
      disp: option.disp,
      type: option.type,
      value: option.value.toString(),
    };

    let newGame = getNewGameForUpdate(game);
    if( !newGame.options ) newGame.options = [];
    const i = findIndex(newGame.options, {name: newOption.name});
    if( i < 0 ) newGame.options.push(newOption);
    if( i >= 0 ) newGame.options[i] = newOption;
    //console.log('setOption newGame', newGame);

    const { loading, error, data } = await updateGame({
      variables: {
        gkey: gkey,
        game: newGame,
      },
      refetchQueries: [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: gkey
        }
      }],
    });
    if( error ) console.log('Error setting option in game', error);

  };

  const renderOption = ({item}) => {
    //console.log('option', item);
    let ret = (<OptionDisplay option={item}/>);
    switch( item.type ) {
      case 'num':
        ret = (<OptionNum option={item} setOption={setOption} readonly={readonly} />)
        break;
      case 'pct':
        ret = (<OptionPct option={item} setOption={setOption} readonly={readonly} />)
        break;
      case 'bool':
        ret = (<OptionBool option={item} setOption={setOption} readonly={readonly} />)
        break;
      case 'menu':
        ret = (<OptionMenu option={item} setOption={setOption} readonly={readonly} />)
        break;
      default:
        break;
    }
    return ret;
  };

  return (
    <Card>
      <Card.Title>Options</Card.Title>
      <Card.Divider />
      <FlatList
        data={allOptions}
        renderItem={renderOption}
        keyExtractor={o => `${o.gamespec_key}_${o.name}`}
      />
    </Card>
  );

};

export default Options;
