import {
  SET_CURRENT_GAME,
  SET_ACTIVE_GAMES,
  SET_GAME_ROUNDS_PLAYERS
} from 'features/games/gameConstants';


export function currentGameReducer(state = {}, action) {
  const { type, game } = action;
  switch (type) {
    case SET_CURRENT_GAME:
      return game;
    default:
      return state;
  }
};


/*

  switch( action.type ) {
    case SET_ACTIVE_GAMES:
      action.activeGames.map(game => {
        if( !game.rounds ) game.rounds = [];
        Game.create(game);
      });
      break;
    case SET_GAME_ROUNDS_PLAYERS:
      action.payload.gameRoundsPlayers.map(rps => {
        Game.withId(action.payload.game_id).rounds.add(rps.round._key);
      });
      break;
  }

*/
