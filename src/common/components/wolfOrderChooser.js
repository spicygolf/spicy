import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Icon,
  ListItem,
} from 'react-native-elements';
import DraggableFlatList from 'react-native-draggable-flatlist';

import { GameContext } from 'features/game/gameContext';



const WolfOrderChooser = props => {

  const { game } = useContext(GameContext);
  const { players } = game;

  // TODO: use game.scope.wolf_order to sort here
  //        also handle if it's null or maybe even if mismatched w/ game.players
  const sorted_players = players;

  const renderItem = ({ item, index, drag, isActive }) => {
    const seq = index + 1;
    const seqText = isActive ? '    ' : `${seq}. `;
    return (
      <ListItem
        key={`item-${index}`}
        containerStyle={{
          backgroundColor: isActive ? '#ddd' : '#fff',
        }}
        onLongPress={drag}
      >
        <Icon
          name='drag'
          type='material-community'
          size={30}
        />
        <ListItem.Content>
          <ListItem.Title>{`${seqText}${item.name}`}</ListItem.Title>
        </ListItem.Content>
      </ListItem>
    );
  };

  const setOrder = data => {
    console.log('endDrag data', data);
    // TODO: update game scope mutation, like teams_rotate
  };

  return (
    <View>
      <DraggableFlatList
        data={sorted_players}
        renderItem={renderItem}
        keyExtractor={(item) => `draggable-item-${item._key}`}
        onDragEnd={({ data }) => setOrder(data)}
      />
    </View>
  );
};

export default WolfOrderChooser;


const styles = StyleSheet.create({

});