import React, { useContext } from 'react';
import {
  FlatList,
  Text,
  View,
} from 'react-native';
import { Card } from 'react-native-elements';

import { GameContext } from 'features/game/gameContext';
import { getAllGamespecOptions } from 'common/utils/game';



const Options = props => {

  const { game } = useContext(GameContext);
  const allGSoptions = getAllGamespecOptions(game);
  console.log('allGSoptions', allGSoptions);

  const renderOption = ({item}) => {
    //console.log('option', item);
    return (
      <View>
        <Text>{item.disp} - {item.default}</Text>
      </View>
    );
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
