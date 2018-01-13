'use strict';

import React from 'react';

import { Provider } from 'react-redux';
import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';

import reducer from './src/reducers';
import Main from './src/containers/main';


const loggerMiddleware = createLogger({
  predicate: (getState, action) => __DEV__
});

function configureStore(initialState) {
  const enhancer = compose(
    applyMiddleware(
      thunkMiddleware,
      loggerMiddleware
    )
  );
  return createStore(reducer, initialState, enhancer);
}

const store = configureStore({});

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <Main />
      </Provider>
    );
  }
};
