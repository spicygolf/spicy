
export const acronym = orig => {
  let matches = orig.match(/\b(\w)/g);
  let acronym = matches.join('');
  return acronym;
};
