import { ghinRequest } from './ghin';
import { Gender, type SearchPlayerRequest, type SearchPlayerResponse } from './types';
import { getGenderEnum } from './util';

export const searchPlayer = async ({q, p}: SearchPlayerRequest): Promise<SearchPlayerResponse[]> => {

  // don't search unless we have at least three characters
  if (q.last_name && q.last_name.length < 3 ) {
    return [];
  }

  // don't search unless field conditions are met
  if (!(q.last_name || q.golfer_id)) {
    return [];
  }

  const params = {
    ...p,
    ...q,
  };

  const resp = await ghinRequest({
    method: 'get',
    url: '/golfers/search.json',
    params,
    data: {},
    attempts: 0,
  });

  const golfers: SearchPlayerResponse[] = resp?.data?.golfers || [];
  return golfers.map((g) => ({
    ...g,
    gender: getGenderEnum(g.gender),
  }));
};
