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
import { useMutation } from '@apollo/client';
import { cloneDeep, find } from 'lodash';

import { UPDATE_GAME_SCOPE_MUTATION } from 'features/game/graphql';
import { GameContext } from 'features/game/gameContext';
import {
  omitTypename,
} from 'common/utils/game';



const WolfOrderChooser = props => {

  const { game } = useContext(GameContext);
  const { players } = game;

  const [ updateGameScope ] = useMutation(UPDATE_GAME_SCOPE_MUTATION);


  const setOrder = async newOrderPlayers => {
    if( !game || !game.scope ) return;
    console.log('setOrder data', newOrderPlayers);

    let newScope = cloneDeep(game.scope);
    newScope.wolf_order = newOrderPlayers.map(p => p._key);
    const newScopeWithoutTypes = omitTypename(newScope);

    const { loading, error, data } = await updateGameScope({
      variables: {
        gkey: game._key,
        scope: newScopeWithoutTypes,
      },
      optimisticResponse: {
        __typename: 'Mutation',
        updateGameScope: {
          __typename: 'Game',
          _key: game._key,
          scope: newScope,
        },
      }
    });

    if( error ) console.log('Error updating game scope - wolfOrderChooser', error);

  };

  // TODO: use game.scope.wolf_order to sort here
  //        also handle if it's null or maybe even if mismatched w/ game.players
  let sorted_players = [];
  if( game && game.scope && game.scope.wolf_order &&
    game.scope.wolf_order.length &&
    game.scope.wolf_order.length == game.players.length
  ) {
    sorted_players = game.scope.wolf_order.map(pkey => {
      const p = find(players, {_key: pkey});
      if( !p ) console.log('a player in wolf_order that is not in players?');
      return p;
    });
  } else {
    sorted_players = players;
    setOrder(sorted_players);
  }

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