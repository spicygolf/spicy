import { fileURLToPath } from 'url';
import grpc from '@grpc/grpc-js';
import path from 'path';
import protoLoader from '@grpc/proto-loader';

const HOST = '[::1]:50051'; // TODO: config value?

const fn = fileURLToPath(import.meta.url);
const PROTO_PATH = path.dirname(fn) + '/../../../sg_hdcp/proto/handicap.proto';
const INCLUDES = [];

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: INCLUDES,
});

const handicapServiceProto = grpc.loadPackageDefinition(packageDefinition);
// console.log('handicapServiceProto', handicapServiceProto);

const handicapClient = new handicapServiceProto.handicap.Handicap(
  HOST,
  grpc.credentials.createInsecure(),
); // , grpc.credentials.createSsl()
// console.log('handicapClient.getHandicap', handicapClient.getHandicap);

export const getHandicap = async ({ source, id }) => {
  return new Promise((resolve, reject) => {
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 5);
    handicapClient.getHandicap(
      { source, id },
      { deadline },
      (error, serverMessage) =>
        error ? reject(error) : resolve(serverMessage),
    );
  })
    .then((h) => {
      // console.log('get_handicap', h);
      return h;
    })
    .catch((e) => {
      console.error('getHandicap GRPC Error', e.message);
      console.error(' for ', source, id);
    });
};

export const searchPlayer = async ({ q, p }) => {
  return new Promise((resolve, reject) => {
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 5);
    handicapClient.searchPlayer(
      { q, p },
      { deadline },
      (error, serverMessage) =>
        error ? reject(error) : resolve(serverMessage),
    );
  })
    .then((h) => {
      // console.log('search_player', h);
      return h;
    })
    .catch((e) => {
      console.error('searchPlayer GRPC Error', e.message);
      console.error(' for ', q, p);
      return [];
    });
};
