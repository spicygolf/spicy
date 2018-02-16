'use strict';

import { ORM } from 'redux-orm';
import Game from 'features/games/gameModel';
import Round from 'features/rounds/roundModel';
import Player from 'features/players/playerModel';

const orm = new ORM();
orm.register(Game, Round, Player);

export default orm;
