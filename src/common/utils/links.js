import { GET_GAME_QUERY } from 'features/games/graphql';
import { course_handicap } from 'common/utils/handicap';




export const linkPlayerToGame = async ({pkey, gkey, link, currentPlayerKey}) => {
  //console.log('linkPlayerToGame');
  //return;
  // link player to game
  try {
    const { loading, error, data } = await link({
      variables: {
        from: {type: 'player', value: pkey},
        to: {type: 'game', value: gkey},
      },
      refetchQueries: () => [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: gkey
        }
      }, {
        query: ACTIVE_GAMES_FOR_PLAYER_QUERY,
        variables: {
          pkey: currentPlayerKey,
        },
        fetchPolicy: 'cache-and-network',
      }],
      awaitRefetchQueries: true
    });
    if( error ) throw (error);

  } catch(e) {
    console.log('error adding player to game', e);
  }
};

export const linkRoundToGameAndPlayer = props => {

  const {round, game, player, isNew, linkRoundToGame, linkRoundToPlayer} = props;

  //console.log('linking round to game and player');
  const { _key: rkey, tee } = round;
  const { _key: gkey, holes } = game;
  const { _key: pkey, handicap } = player;

  // first see if we can calc a course_handicap
  let other = [];
  try {
    const hi = handicap.index;
    if( hi ) other.push({key: 'handicap_index', value: hi});
    const ch = course_handicap(hi, tee, holes);
    //console.log('LinkRound ch', ch);
    if( ch ) other.push({key: 'course_handicap', value: ch});
    //console.log('LinkRound other', other);
  } catch(e) {
    console.log('Could not calc a course handicap for ', round);
    console.log('error', e);
  }

  // link round to game
  let { loading: r2gLoading, error: r2gError, data: r2gData } = linkRoundToGame({
    variables: {
      from  : {type: 'round', value: rkey},
      to    : {type: 'game', value: gkey},
      other: other,
    },
    refetchQueries: () => [{
      query: GET_GAME_QUERY,
      variables: {
        gkey: gkey
      }
    }],
    awaitRefetchQueries: true,
  });
  //console.log('r2gData', r2gData);

  if( isNew ) {
    // link round to player
    let { loading: r2pLoading, error: r2pError, data: r2pData } = linkRoundToPlayer({
      variables: {
        from: {type: 'round', value: rkey},
        to:   {type: 'player', value: pkey},
      },
      refetchQueries: () => [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: gkey
        }
      }],
      awaitRefetchQueries: true,
    });
    //console.log('r2pData', r2pData);
  }

};
