'use strict';

import { ORM } from 'redux-orm';
import { Game, Round, Player } from './models';

const orm = new ORM();
orm.register(Game, Round, Player);

export default orm;
