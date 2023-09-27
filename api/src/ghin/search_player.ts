import { ghin_request, Pagination } from './ghin';

type SearchPlayerRequest = {
  token: string | null;
  q: SearchPlayerQuery;
  p: Pagination;
};

type SearchPlayerQuery = {
  golfer_id?: string;
  last_name?: string;
  first_name?: string;
  state?: string;
  country?: string;
  local_number?: string;
  email?: string;
  phone_number?: string;
  association_id?: number;
  club_id?: string;
  sorting_criteria?: string;
  order?: string;
  status?: string;
  updated_since?: string;
  soft_cap?: boolean;
  hard_cap?: boolean;
  is_test?: boolean;
};

type SearchPlayerResponse = {

};

export const search_player = async ({token, q, p}: SearchPlayerRequest): Promise<SearchPlayerResponse | null> => {

  const params = {
    ...p,
    ...q,
  };

  const resp = await ghin_request({
    method: 'get',
    url: '/golfers/search.json',
    params,
    data: {},
    token,
    attempts: 0,
  });

  return resp?.data;
};
