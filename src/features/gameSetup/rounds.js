import React from 'react';

import moment from 'moment';

import { AddRoundMutation } from 'features/rounds/graphql';



class Rounds extends React.Component {

  constructor(props) {
    super(props);
    console.log('Rounds props', props);
    if( props.rounds.length == 0 ) {
      this._createRound();
    }
    this._createRound = this._createRound.bind(this);
    this._linkRound = this._linkRound.bind(this);
  }

  _createRound() {
    return (
      <AddRoundMutation>
        {async ({addRoundMutation}) => {
          const {data, errors} = await addRoundMutation({
            variables: {
              round: {
                date: moment.utc().format(this.props.day),
                seq: 1,
                scores: []
              }
            }
          });
          console.log('mutation', data, errors);
          if( !errors || errors.length == 0 ) {
            this._linkRound(data.addRound._key);
          } else {
            console.log(`addRoundMutation didn't work`, errors);
          }
          return;
        }}
      </AddRoundMutation>
    );
  }

  _linkRound(rkey) {
    console.log(
      `linking round ${rkey}
       to player ${this.props.pkey}
       and game ${this.props.gkey}`);

    this.props.navigation.navigate('GameSetup');
  }

  render() {


    return (null);
  }
}

export default Rounds;
