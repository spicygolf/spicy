import { useLazyQuery, useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import GhinSearchPlayer from 'common/components/ghin/player/search';
import { GameContext } from 'features/game/gameContext';
import { ADD_PLAYER_MUTATION, LOOKUP_PLAYER_BY_GHIN } from 'features/players/graphql';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';

const AddPlayerGHINSearch = (props) => {
  const defaultNewPlayer = {
    country: 'USA',
    state: '',
    lastName: '',
    firstName: '',
  };
  const [newPlayer, setNewPlayer] = useState(defaultNewPlayer);
  const [lookupPkey, { data: lPkey }] = useLazyQuery(LOOKUP_PLAYER_BY_GHIN);
  const [pkey, setPkey] = useState();
  const [addPlayer] = useMutation(ADD_PLAYER_MUTATION);
  const { currentPlayerKey, game } = useContext(GameContext);
  const navigation = useNavigation();

  // see if player already in spicy w/ lookup on ghin #
  useEffect(() => {
    //console.log('newPlayer', newPlayer);
    if (newPlayer && newPlayer.ghinCreds && newPlayer.ghinCreds.ghinNumber) {
      lookupPkey({
        variables: { ghin: newPlayer.ghinCreds.ghinNumber },
      });
    }
  }, [lookupPkey, newPlayer]);

  // if already in spicy, set pkey
  // if not already in spicy w/ lookup on ghin #, then use addPlayer() mutation
  useEffect(() => {
    const handleLookup = async () => {
      if (lPkey && lPkey.lookupPlayerByGhin) {
        const l = lPkey.lookupPlayerByGhin;
        if (l.length > 0) {
          // found existing spicy user for this ghin player
          setPkey(l[0]._key);
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
          }
          if (data && data.addPlayer && data.addPlayer._key) {
            setPkey(data.addPlayer._key);
          }
        }
      }
    };
    handleLookup();
  }, [
    addPlayer,
    currentPlayerKey,
    lPkey,
    newPlayer.handicap,
    newPlayer.name,
    newPlayer.short,
  ]);

  // then add player to game
  useEffect(() => {
    if (pkey) {
      const player = {
        _key: pkey,
        name: newPlayer.name,
        handicap: newPlayer.handicap,
      };
      //console.log('player', player);
      navigation.navigate('LinkRoundList', { game, player });
    }
  }, [game, navigation, newPlayer.handicap, newPlayer.name, pkey]);

  return <GhinSearchPlayer state={newPlayer} setState={setNewPlayer} />;
};

export default AddPlayerGHINSearch;
