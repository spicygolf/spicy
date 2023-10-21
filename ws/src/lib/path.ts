export const pathParser = (path: string) => {
  return path.substr(0, path.length - '/.websocket'.length);
};
