'use strict';

import * as gameActions from './games';
import * as roundActions from './rounds';

export const ActionCreators = Object.assign(
  {},
  gameActions,
  roundActions
);
