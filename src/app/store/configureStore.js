
import { createStore, applyMiddleware, compose } from 'redux';

import thunkMiddleware from 'redux-thunk';

import { createLogger } from 'redux-logger';

import rootReducer from "app/reducers/rootReducer";


const loggerMiddleware = createLogger({
  predicate: (getState, action) => __DEV__
});


export default function configureStore(initialState) {
  const enhancer = compose(
    applyMiddleware(
      thunkMiddleware,
      loggerMiddleware
    )
  );
  const store = createStore(
    rootReducer,
    initialState,
    enhancer
  );

  if( module.hot ) {
    // enable webpack hot module replacement for reducers
    module.hot.accept('..//reducers', () => {
      const nextRootReducer = require('../reducers/rootReducer');
      store.replaceReducer(nextRootReducer);
    });
  }
  return store;
}
