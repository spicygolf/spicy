'use strict';

import orm from './orm';

export default function createReducer(initialState, handlers) {
  return function reducer(state = initialState, action) {
    const session = orm.session(state);
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action, session);
    } else {
      return state;
    }
  };
}
