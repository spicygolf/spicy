import { Doc } from './doc';
import { db } from '../db/db';

const collection = db.collection('events');

class Event extends Doc {
  constructor() {
    super(collection);
  }
}

const _Event = Event;
export { _Event as Event };
