import { Doc } from './doc';
import { db } from '../db/db';

const collection = db.collection('options');

class Option extends Doc {
  constructor() {
    super(collection);
  }

}

const _Option = Option;
export { _Option as Option };