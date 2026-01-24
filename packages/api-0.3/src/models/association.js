import { db } from "../db/db";
import { Doc } from "./doc";

const collection = db.collection("associations");

class Association extends Doc {
  constructor() {
    super(collection);
  }
}

const _Association = Association;
export { _Association as Association };
