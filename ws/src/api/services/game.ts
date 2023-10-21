import { GameCreatedRequest, GameCreatedResponse } from 'spicylib/types';

export const GameCreated = (ws: WebSocket, message: GameCreatedRequest) => {
  const resp: GameCreatedResponse = {
    event: 'GameCreated',
    id: message.id,
    gkey: '1',
  };
  ws.send(JSON.stringify(resp));
};
