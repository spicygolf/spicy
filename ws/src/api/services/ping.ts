
type PingRequest = {
  event: string;
  reqid: string;
};

type PingResponse = {
  event: string;
  reqid: string;
};

export const ping = (ws: WebSocket, message: PingRequest) => {
  const resp: PingResponse = {
    event: 'pong',
    reqid: message.reqid
  };
  ws.send(JSON.stringify(resp));
};
