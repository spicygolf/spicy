import path from 'path';
import { fileURLToPath } from 'url';

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const HOST = '[::1]:50051'; // TODO: config value?

const fn = fileURLToPath(import.meta.url);
const PROTO_PATH = path.dirname(fn) + '/../../../ghin/proto/handicap.proto';
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

const doGRPC = async (name, args) => {
  return new Promise((resolve, reject) => {
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 15);
    handicapClient[name](
      args,
      { deadline },
      (error, serverMessage) =>
        error ? reject(error) : resolve(serverMessage),
    );
  })
    .then((h) => {
      // console.log(name, h);
      return h;
    })
    .catch((e) => {
      console.error(`${name} GRPC Error`, e.message, ', for: ', JSON.stringify(args, null, null));
    });
};

export const getHandicap = async (args) => doGRPC('getHandicap', args);
export const searchPlayer = async (args) => doGRPC('searchPlayer', args);
export const getCourse = async (args) => doGRPC('getCourse', args);
export const searchCourse = async (args) => doGRPC('searchCourse', args);
export const getTee = async (args) => doGRPC('getTee', args);
