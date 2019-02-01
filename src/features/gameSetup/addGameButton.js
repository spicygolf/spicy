import React from 'react';

import {
  Button
} from 'react-native-elements';

import { withApollo } from 'react-apollo';

import {
  AddGameMutation,
  CURRENT_GAME_QUERY
} from 'features/games/graphql';

import { navigate } from 'common/components/navigationService';

import { green } from 'common/colors';



class AddGameButton extends React.Component {


  render() {
    return (
      <AddGameMutation>
        {({addGameMutation}) => (
          <Button
            title='Play Game'
            onPress={async () => {
              const {data, errors} = await addGameMutation({
                variables: {
                  game: {
                    name: this.props.gamespec.name,
                    start: '2019-01-01',
                    end: '2019-01-01',
                    gametype: this.props.gamespec._key
                  }
                }
              });

              if( data && data.addGame && data.addGame._key &&
                  (!errors || errors.length == 0 ) ) {
                const res = this.props.client.writeQuery({
                  query: CURRENT_GAME_QUERY,
                  data: {
                    currentGame: data.addGame._key
                  }
                });
                console.log('writeQuery res', res);
                navigate('Game');
              } else {
                console.log('addGame did not work', errors);
              }
            }}
            color='white'
            backgroundColor={green}
            fontWeight='bold'
          />
        )}
      </AddGameMutation>

    );
  }
}


export default withApollo(AddGameButton);
