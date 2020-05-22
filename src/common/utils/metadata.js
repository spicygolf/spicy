import AsyncStorage from '@react-native-community/async-storage';
import moment from 'moment';
import { find, findIndex } from 'lodash';



export const getMeta = async key => {
  let ret = null;
  try {
    const value = await AsyncStorage.getItem(key);
    ret = JSON.parse(value);
  } catch(e) {
    console.log('Error getting metadata from AsyncStorage', e);
  }
  return ret;
};


export const setMeta = async (key, value) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};


export const getGamesMeta = async () => {
  return await getMeta('games');
};


export const setGamesMeta = async gamesMeta => {
  return await setMeta('games', gamesMeta);
};


export const getGameMeta = async gkey => {
  const games = await getMeta('games');
  return find(games, {gkey: gkey});
};


export const setGameMeta = async (gkey, key, value) => {
  const ts = moment.utc().format();
  let gamesMeta = await getGamesMeta(gkey);
  if( !gamesMeta ) gamesMeta = [];
  let game = find(gamesMeta, {gkey: gkey});
  if( !game ) game = { gkey, ts, };
  game[key] = value;
  const i = findIndex(gamesMeta, {gkey: gkey});
  if( i >= 0 ) {
    gamesMeta[i] = game;
  } else {
    gamesMeta.push(game);
  }
  //console.log('setGameMeta gamesMeta: ', gamesMeta);
  await setGamesMeta(gamesMeta);
};


// TODO: implement me
export const clearGamesMeta = async () => {

};
