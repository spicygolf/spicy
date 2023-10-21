let ws_conn: WebSocket;

export const init = () => {
  const url = 'ws://localhost:3000/';
  if (!ws_conn) {
    ws_conn = new WebSocket(url);
  }

  ws_conn.onerror = (error) => {
    console.log(`WS API error: ${error}`)
  };

  ws_conn.onopen = () => {
    console.log('WS API connected');
  };

  ws_conn.onmessage = (msg) => {
    console.log('WS API says:', msg.data)
  };

};

export const send = (event: string, payload: object) => {
  const msg: object = {
    event,
    ...payload,
  };
  if (ws_conn && ws_conn.readyState === ws_conn.OPEN) {
    ws_conn.send(JSON.stringify(msg));
  } else {
    console.error('WS API not connected');
  }
};
