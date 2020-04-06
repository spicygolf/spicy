import React, { useContext } from 'react';
import {
  FlatList,
  Text,
  View,
} from 'react-native';
import { Card } from 'react-native-elements';

import { GameContext } from 'features/game/gameContext';
import { getAllGamespecOptions } from 'common/utils/game';
import OptionDisplay from 'features/gameSetup/optionDisplay';
import OptionNum from 'features/gameSetup/optionNum';
import OptionPct from 'features/gameSetup/optionPct';
import OptionBool from 'features/gameSetup/optionBool';
import OptionMenu from 'features/gameSetup/optionMenu';



const Options = props => {

  const { game } = useContext(GameContext);
  const allGSoptions = getAllGamespecOptions(game);

  const renderOption = ({item}) => {
    console.log('option', item);
    let ret = (<OptionDisplay option={item}/>);
    switch( item.type ) {
      case 'num':
        ret = (<OptionNum option={item}/>)
        break;
      case 'pct':
        ret = (<OptionPct option={item}/>)
        break;
      case 'bool':
        ret = (<OptionBool option={item}/>)
        break;
      case 'menu':
        ret = (<OptionMenu option={item}/>)
        break;
      default:
        break;
    }
    return ret;
  };

  return (
    <Card title="Options">
      <FlatList
        data={allGSoptions}
        renderItem={renderOption}
        keyExtractor={o => `${o.gamespec_key}_${o.name}`}
      />
    </Card>
  );

};

export default Options;
