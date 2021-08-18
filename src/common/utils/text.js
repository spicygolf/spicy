export const acronym = (orig) => {
  if (orig && orig.length < 10) return orig;
  let matches = orig.match(/\b(\w)/g);
  let acronym = matches.join('');
  return acronym;
};

export const first = (name) => {
  const names = name.split(' ');
  return names[0] || '';
};

// TODO: handle name suffixes such as III, Jr. Sr. whatever...
export const last = (name) => {
  const names = name.split(' ');
  return names[names.length - 1] || '';
};
