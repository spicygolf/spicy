import React from 'react';
import { View } from 'react-native'
import { Query, withApollo } from 'react-apollo';

import {
  CURRENT_PLAYER_QUERY,
  GET_PLAYER_QUERY
} from 'features/players/graphql';

import {
  activeGamesForPlayer
} from 'features/games/graphql';



const Q = ({q, v}) => {

  return (
    <Query query={q} variables={v}>
       {({ loading, error, data }) => {
         if( loading ) return null;
         if( error ) return error;
         // we want this in cache only, so don't return anything of note
         return null;
       }}
    </Query>
  );

};

const InitialData = ({player, client}) => {

  // for DEV
  client.resetStore();

  client.query({
    query: GET_PLAYER_QUERY,
    variables: {
      player: player
    }
  })
    .then((res) => {
      console.log('res', res);
    });

/*
  const ret = (
    <Query query={GET_PLAYER_QUERY} variables={{player: player}}>
      {({ loading, error, data }) => {
        if( loading ) return null;

        console.log('getPlayer data', data);
        client.writeQuery({
          query: CURRENT_PLAYER_QUERY,
          data: {
            currentPlayer: getPlayer
          }
        });
        return (
          <Q q={activeGamesForPlayer} v={{pkey: player}} />
        );
      }}
    </Query>
  );
  return ret;
*/
};

export default withApollo(InitialData);
