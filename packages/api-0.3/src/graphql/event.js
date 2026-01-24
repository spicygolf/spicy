import { Event } from "../models/event";

export const EventTypeDefs = `
type Event {
  _key: String!
  name: String!
  start: String!
  end: String
  teams: Boolean
}

type EventKey {
  _key: String!
}

input EventInput {
  name: String!
  start: String!
  end: String
  teams: Boolean
}

`;

export const EventQuerySigs = `
`;

export const EventMutationSigs = `
  addEvent(event: EventInput!): Event
`;

export const EventResolvers = {
  Query: {},
  Mutation: {
    addEvent: async (_, { event }) => {
      // TODO: add to immutable message log?
      var e = new Event();
      e.set(event);
      const newEvent = await e.save({
        returnNew: true,
      });
      //console.log('addEvent event', newEvent);
      return newEvent.new;
    },
  },
};
