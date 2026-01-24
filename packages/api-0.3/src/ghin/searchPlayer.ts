import { ghinRequest, type Pagination } from "./ghin";

type SearchPlayerRequest = {
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

// TODO: codegen from graphql, use those types
type SearchPlayerResponse = {
  golfer_id?: string;
  last_name?: string;
  first_name?: string;
  status?: string;
  hi_display?: string;
};

export const searchPlayer = async ({
  q,
  p,
}: SearchPlayerRequest): Promise<object[] | null> => {
  console.log("searchPlayer", q, p);
  return [];

  // don't search unless we have at least three characters
  if (q?.last_name?.length < 3) {
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
    method: "get",
    url: "/golfers/search.json",
    params,
    data: {},
    attempts: 0,
  });

  const golfers = resp?.data?.golfers || [];
  return golfers.map((g: SearchPlayerResponse) => ({
    ...g,
    firstName: g.first_name,
    lastName: g.last_name,
    playerName: `${g.first_name} ${g.last_name}`,
    active: g.status === "Active",
    index: g.hi_display,
  }));
};
