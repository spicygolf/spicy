import React from 'react';
import { View } from 'react-native'
import { Query, withApollo } from 'react-apollo';

import {
  currentPlayer,
  getPlayer
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

  client.writeQuery({
    query: currentPlayer,
    data: {
      currentPlayer: player
    }
  });

  return (
    <React.Fragment>
      <Q q={getPlayer} v={{player: player}} />
      <Q q={activeGamesForPlayer} v={{pkey: player}} />
    </React.Fragment>
  );
}

export default withApollo(InitialData);
