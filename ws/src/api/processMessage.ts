import { GameCreated } from "./services/game";
import { ping } from "./services/ping";

type WSOptions = {
  message: any;
  path: string;
  query: object;
};

/**
 *
 * @param {object} ws WebSocket connection.
 * @param {object} options
 * @param {string} options.path The path in which the message was received.
 * @param {object} options.query The query parameters used when connecting to the server.
 * @param {object} options.message The received message.
 */
export const processMessage = async (ws: WebSocket, { message, path, query }: WSOptions) => {
  try {
    const parsedMessage = JSON.parse(message);
    switch (parsedMessage.event) {
      case 'ping':
        ping(ws, parsedMessage);
        break;
      case 'GameCreated':
        GameCreated(ws, parsedMessage);
        break;
      default:
        const resp = {
          error: 'bad message',
          message: parsedMessage,
        }
        ws.send(JSON.stringify(resp));
    }
  } catch (e) {
    console.error(e);
  }
};
