import { db } from "../db/db";
import { Doc } from "./doc";

const collection = db.collection("options");

class Option extends Doc {
  constructor() {
    super(collection);
  }
}

const _Option = Option;
export { _Option as Option };
