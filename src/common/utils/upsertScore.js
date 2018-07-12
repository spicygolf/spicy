import moment from 'moment';
import { cloneDeep, find, indexOf, unionBy } from 'lodash';


export const upsertScore = (arr, hole, key, newval) => {
  const ts = moment.utc().format();
  const h = find(arr, {hole: hole});
  if( h ){
    // replace values of key for this hole
    const newVals = unionBy([{k: key, v: newval, ts: ts}], h.values, key);
    // place new values into hole's scores
    let newArr = cloneDeep(arr);
    const i = indexOf(newArr, find(newArr, {hole: hole}));
    newArr[i] = {hole: hole, values: newVals};
    return newArr;
  } else {
    arr.push({
      hole: hole,
      values: [{
        k: key, v: newval, ts: ts
      }]
    });
    return arr;
  }
};
