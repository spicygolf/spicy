export const rmlink = async (fromType, fromKey, toType, toKey, unlink) => {
  const { error, data } = await unlink({
    variables: {
      from: { type: fromType, value: fromKey },
      to: { type: toType, value: toKey },
    },
  });
  if (error) {
    console.log('error removing link', error);
    console.log('rmlink', fromType, fromKey, toType, toKey);
    return null;
  }
  //console.log('rm data', data, fromType, fromKey, toType, toKey);
  return data;
};
