'use strict';

import { Doc } from './doc';
import { aql } from 'arangojs';
import { db } from '../db/db';

const collection = db.collection('associations');

class Association extends Doc {
  constructor() {
    super(collection);
  }
}

const _Association = Association;
export { _Association as Association };
