import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { ListItem } from 'react-native-elements';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';

import GameNav from 'features/games/gamenav';

import {
  ACTIVE_GAMES_FOR_PLAYER_QUERY,
  GAMESPECS_FOR_PLAYER_QUERY,
  ADD_GAME_MUTATION,
} from 'features/games/graphql';
import { ADD_LINK_MUTATION } from 'common/graphql/link';



const NewGame = props => {

  const { route } = props;
  const { currentPlayerKey } = route.params;

  const navigation = useNavigation();
  const [ addGameMutation ] = useMutation(ADD_GAME_MUTATION);
  const [ addLinkMutation ] = useMutation(ADD_LINK_MUTATION);

  const gamespecPressed = async gamespec => {
    const game = await addGame(gamespec);
    const linkg2gs = await linkGameToGamespec(game, gamespec)
    const linkp2g = await linkCurrentPlayerToGame(game);
    const { _key: gkey } = game;
    navigation.navigate('Game', {
      currentGameKey: gkey,
      setup: true,
    });
  };

  const addGame = async gamespec => {
    // add new game
    const { loading, error, data } = await addGameMutation({
      variables: {
        game: {
          name: gamespec.name,
          start: moment.utc().format(),
          holes: 'all18',
          teams: {
            rotate: 'never',
          },
          options: gamespec.defaultOptions || []
        },
      },
    });
    // TODO: handle loading, error?
    //console.log('newGame data', data);
    return data.addGame;
  };

  const linkGameToGamespec = async (game, gamespec) => {
    const { loading, error, data } = await addLinkMutation({
      variables: {
        from: {type: 'game', value: game._key},
        to: {type: 'gamespec', value: gamespec._key},
      },
      refetchQueries: () => [{
        query: ACTIVE_GAMES_FOR_PLAYER_QUERY,
        variables: {
          pkey: currentPlayerKey,
        },
        fetchPolicy: 'cache-and-network',
      }],
    });
    // TODO: handle loading, error?
    //console.log('newGame linkg2gs', data);
    return data.link;

  };

  const linkCurrentPlayerToGame = async (game) => {
    // now add current logged in player to game via edge
    const { _key: gkey } = game;
    let others = [
      {key: 'created_by', value: 'true'},
    ];
    const { loading, error, data } = await addLinkMutation({
      variables: {
        from: {type: 'player', value: currentPlayerKey},
        to: {type: 'game', value: gkey},
        other: others,
      },
      refetchQueries: () => [{
        query: ACTIVE_GAMES_FOR_PLAYER_QUERY,
        variables: {
          pkey: currentPlayerKey,
        },
        fetchPolicy: 'cache-and-network',
      }],
    });
    // TODO: handle loading, error?
    //console.log('newGame linkp2g', data);
    return data.link;
  };

  // `item` is a gamespec
  const _renderItem = ({item}) => {
    return (
      <ListItem
        roundAvatar
        title={item.name || ''}
        subtitle={item.type || ''}
        onPress={() => gamespecPressed(item)}
        testID={`new_${item._key}`}
      />
    );
  };

  const { data, loading, error} = useQuery(GAMESPECS_FOR_PLAYER_QUERY, {
    variables: {
      pkey: currentPlayerKey,
    },
    fetchPolicy: 'cache-and-network',
  });

  if( loading ) return (<ActivityIndicator />);

  // TODO: error component instead of below...
  if( error || !data.gameSpecsForPlayer ) {
    console.log(error);
    return (<Text>Error</Text>);
  }

  return (
    <View>
      <GameNav
        title='New Game'
        showBack={true}
      />
      <FlatList
        data={data.gameSpecsForPlayer}
        renderItem={_renderItem}
        keyExtractor={item => item._key}
      />
    </View>
  );

};

export default NewGame;
