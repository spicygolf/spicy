'use strict';

import React from 'react';

import { Provider } from 'react-redux';
import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { createReducer } from 'redux-orm';

import orm from './src/state/lib/orm';
import Main from './src/containers/main';


const loggerMiddleware = createLogger({
  predicate: (getState, action) => __DEV__
});

const reducer = createReducer(orm);

function configureStore(initialState) {
  const enhancer = compose(
    applyMiddleware(
      thunkMiddleware,
      loggerMiddleware
    )
  );
  return createStore(reducer, initialState, enhancer);
}

const store = configureStore(orm.getEmptyState());

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <Main />
      </Provider>
    );
  }
};
