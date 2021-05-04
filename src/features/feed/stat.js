import React, { useContext, } from 'react';
import {
  StyleSheet,
  Text,
} from 'react-native';
import {
  Card,
} from 'react-native-elements';
import { useQuery } from '@apollo/client';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { STAT_FOR_PLAYER_FEED } from 'features/feed//graphql';



const Stat = props => {

  const { stat, side } = props;
  let title = '';

  const { currentPlayer: cp } = useContext(CurrentPlayerContext);
  //console.log('cp', cp);
  const currentPlayer = `players/${cp._key}`;
  const myClubs = cp.clubs.map(c => `clubs/${c._key}`);

  const { loading, error, data } = useQuery(STAT_FOR_PLAYER_FEED, {
    variables: {
      ...props,
      currentPlayer,
      myClubs,
    }
  });

  switch( stat ) {
    case 'public':
      title = 'Spicy Golf';
      break;
    case 'myclubs':
      title = 'My Club';
      if( myClubs.length > 1 ) title = title + 's';
      break;
    case 'faves':
      title = 'My Favorites';
      break;
    case 'me':
      title = 'Me';
      break;
  }

  if( error && error.message != 'Network request failed') {
    console.log(error);
    // TODO: error component
  }

  let statValue = ' ';
  if( data ) statValue = data.statForPlayerFeed;
  //console.log('data', data, myClubs);

  return (
    <Card
      containerStyle={[styles.container, styles[side]]}
    >
      <Card.Title>{title}</Card.Title>
      <Text style={styles.stat}>{statValue}</Text>
    </Card>
  );

};

export default Stat;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 15,
  },
  left: {
    marginLeft: 15,
    marginRight: 7,
  },
  right: {
    marginLeft: 8,
    marginRight: 15,
  },
  stat: {
    fontSize: 48,
    //fontWeight: 'bold',
    alignSelf: 'center',
  },
});