
import { createStore, applyMiddleware, compose } from 'redux';

import thunkMiddleware from 'redux-thunk';

import createLogger from 'redux-logger';

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

  return store;
}
