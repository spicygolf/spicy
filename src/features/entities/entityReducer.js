import {
  ENTITY_UPDATE,
  ENTITY_DELETE,
  ENTITY_CREATE,
  ENTITY_UPSERT
} from "./entityConstants";

import {createConditionalSliceReducer} from "common/utils/reducerUtils";

import orm from "app/schema";

export function updateEntity(state, payload) {
  const {itemType, itemID, newItemAttributes} = payload;

  const session = orm.session(state);
  const ModelClass = session[itemType];

  if(ModelClass.hasId(itemID)) {
    const modelInstance = ModelClass.withId(itemID);

    modelInstance.update(newItemAttributes);
  }

  return session.state;
}


export function deleteEntity(state, payload) {
  const {itemID, itemType} = payload;

  const session = orm.session(state);
  const ModelClass = session[itemType];

  if(ModelClass.hasId(itemID)) {
    const modelInstance = ModelClass.withId(itemID);

    // The session will immutably update its state reference
    modelInstance.delete();
  }

  // This will either be the original state object or the updated one
  return session.state;
}

export function createEntity(state, payload) {
  const {itemType, newItemAttributes} = payload;

  const session = orm.session(state);
  const ModelClass = session[itemType];

  ModelClass.create(newItemAttributes);

  return session.state;
}


export function upsertEntity(state, payload) {
  const {itemType, itemID, newItemAttributes} = payload;

  const session = orm.session(state);
  const ModelClass = session[itemType];

  if(ModelClass.hasId(itemID)) {
    const modelInstance = ModelClass.withId(itemID);
    modelInstance.update(newItemAttributes);
  } else {
    ModelClass.create(newItemAttributes);
  }

  return session.state;
}


const entityHandlers = {
  [ENTITY_UPDATE] : updateEntity,
  [ENTITY_CREATE] : createEntity,
  [ENTITY_DELETE] : deleteEntity,
  [ENTITY_UPSERT] : upsertEntity
};

const entityCrudFeatureReducer = createConditionalSliceReducer("entities", entityHandlers);

export default entityCrudFeatureReducer;
