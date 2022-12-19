import { useLazyQuery, useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import GhinSearchPlayer from 'common/components/ghin/player/search';
import { GameContext } from 'features/game/gameContext';
import { ADD_PLAYER_MUTATION, LOOKUP_PLAYER_BY_GHIN } from 'features/players/graphql';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const AddPlayerGHINSearch = (props) => {
  const defaultNewPlayer = {
    country: 'USA',
    state: '',
    lastName: '',
    firstName: '',
  };
  const [newPlayer, setNewPlayer] = useState(defaultNewPlayer);
  const [lookupPkey, { data: lPkey }] = useLazyQuery(LOOKUP_PLAYER_BY_GHIN);
  const [addPlayer] = useMutation(ADD_PLAYER_MUTATION);
  const { currentPlayerKey, game } = useContext(GameContext);
  const navigation = useNavigation();

  // see if player already in spicy w/ lookup on ghin #
  useEffect(
    () => {
      if (newPlayer?.handicap?.id) {
        lookupPkey({
          variables: { ghin: newPlayer.handicap.id },
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [newPlayer],
  );

  // if already in spicy, set pkey
  // if not already in spicy w/ lookup on ghin #
  // then use addPlayer() mutation
  // finally add player/round to game
  useEffect(
    () => {
      const handleLookup = async () => {
        let lrlPlayer = {
          name: newPlayer.name,
          handicap: newPlayer.handicap,
        };
        if (lPkey && lPkey.lookupPlayerByGhin) {
          const l = lPkey.lookupPlayerByGhin;
          if (l.length > 0) {
            // found existing spicy user for this ghin player
            lrlPlayer._key = l[0]._key;
          } else {
            const player = {
              name: newPlayer.name,
              short: newPlayer.short,
              handicap: newPlayer.handicap,
              statusAuthz: ['prod'],
              createdBy: currentPlayerKey,
              createdDate: moment.utc().format(),
            };
            const { error, data } = await addPlayer({
              variables: { player },
            });
            if (error) {
              // TODO: error component
              console.log('error adding player', error);
              return;
            }
            if (data?.addPlayer?._key) {
              lrlPlayer._key = data.addPlayer._key;
              // setPkey(data.addPlayer._key);
            }
          }
          // then add player/round to game
          //console.log('lrlPlayer', lrlPlayer);
          navigation.navigate('LinkRoundList', { game, player: lrlPlayer });
        }
      };
      handleLookup();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPlayerKey, lPkey, newPlayer.handicap, newPlayer.name, newPlayer.short],
  );

  return (
    <View style={styles.container}>
      <GhinSearchPlayer state={newPlayer} setState={setNewPlayer} />
    </View>
  );
};

export default AddPlayerGHINSearch;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    flex: 1,
  },
});
