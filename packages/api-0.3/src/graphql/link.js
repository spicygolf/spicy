import { Edge } from "../models/edge";

export const LinkTypeDefs = `
type Link {
  _key: String!
  type: String!
  _from: String!
  _to: String!
}

type LinkKey {
  _key: String!
}

input KV {
  key: String!
  value: String
}

input LinkInput {
  type: String!
  value: String!
}
`;

export const LinkQuerySigs = `
  getLink(_key: String!): Link
  findLink(from: LinkInput!, to: LinkInput!): Link
`;

export const LinkMutationSigs = `
  link(from: LinkInput!, to: LinkInput!, other: [KV]): LinkKey
  unlink(from: LinkInput!, to: LinkInput!): Boolean
  update(from: LinkInput!, to: LinkInput!, other: [KV]): Boolean
  upsert(from: LinkInput!, to: LinkInput!, other: [KV]): Link
`;

export const LinkResolvers = {
  Query: {
    getLink: (_, { _key }) => {
      const e = new Edge();
      return e.load(_key);
    },
    findLink: (_, { from, to }) => {
      const f = `${from.type}s/${from.value}`;
      const t = `${to.type}s/${to.value}`;
      const type = `${from.type}2${to.type}`;

      const e = new Edge(type);
      return e
        .find(f, t)
        .then((res) => (res?.[0] ? res[0] : null))
        .catch((_err) => null);
    },
  },
  Mutation: {
    link: (_, { from, to, other }) => {
      const f = `${from.type}s/${from.value}`;
      const t = `${to.type}s/${to.value}`;
      const type = `${from.type}2${to.type}`;

      // TODO: add to immutable message log?
      const e = new Edge(type);
      e.from_to(f, t);
      e.other(other);
      return e.save();
    },
    unlink: async (_, { from, to }) => {
      const f = `${from.type}s/${from.value}`;
      const t = `${to.type}s/${to.value}`;
      const type = `${from.type}2${to.type}`;

      // TODO: add to immutable message log?
      const e = new Edge(type);
      const edges = await e.find({
        _from: f,
        _to: t,
        type: type,
      });

      edges.map(async (edge) => {
        await e.remove(edge._key);
      });
      return true;
    },
    update: async (_, { from, to, other }) => {
      const f = `${from.type}s/${from.value}`;
      const t = `${to.type}s/${to.value}`;
      const type = `${from.type}2${to.type}`;

      // TODO: add to immutable message (subscription)?
      const e = new Edge(type);
      const edges = await e.find({
        _from: f,
        _to: t,
        type: type,
      });

      edges.map(async (edge) => {
        await e.load(edge._key);
        e.other(other);
        await e.save({ overwrite: true, returnNew: true });
        // console.log('update', ret);
      });
      return true;
    },
    upsert: async (_, { from, to, other }) => {
      const _from = `${from.type}s/${from.value}`;
      const _to = `${to.type}s/${to.value}`;
      const type = `${from.type}2${to.type}`;

      // TODO: add to subscription message?
      const e = new Edge(type);
      e.from_to(_from, _to);
      e.other(other);
      const newE = e.get();
      return await e.upsert(newE, { _from, _to, type }, { returnNew: true });
    },
  },
};
