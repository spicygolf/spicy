import axios, { AxiosResponse } from 'axios';
import { search_player } from './search_player';
import { login } from './login';

const { GHIN_BASE_URL, GHIN_EMAIL, GHIN_PASS } = process.env;
const retries = 3;

const instance = axios.create({
  baseURL: GHIN_BASE_URL,
  timeout: 10000, // ms
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  }
});

type GhinRequest = {
  method: string;
  url: string;
  params?: object;
  data?: object;
  token?: string | null;
  attempts: number;
};

export const ghin_request = async ({method, url, params, data, token, attempts}: GhinRequest) => {
  attempts++;

  if (attempts > retries) {
    console.error({method, url, params, data, error: `retries exceeded ${retries}`});
    return null;
  }

  const headers = (token !== null) ? {
    Authorization: `Bearer ${token}`
  } : {};

  try {
    const resp: AxiosResponse = await instance.request({
      method,
      url,
      params,
      data,
      headers,
    });
    // TODO: inspect resp for 40x, 200, etc.
    // retries...
    console.log('resp status', resp.status)
    return resp;
  } catch(error) {
    console.error({method, url, params, data, error});
  }


};

export type Pagination = {
  page: number;
  per_page: number;
};

const main = async () => {
  // login & get token
  const token = await login({
    email: GHIN_EMAIL,
    password: GHIN_PASS,
    remember_me: true
  });

  // search for a player
  const search_player_resp = await search_player({
    token,
    q: {
      last_name: 'anderson',
      first_name: 'brad',
      country: 'US',
      state: 'GA',
      status: 'Active',
      sorting_criteria: 'full_name',
      order: 'ASC'
    },
    p: {
      page: 1,
      per_page: 50,
    }
  });
  console.log('search_player', search_player_resp);


};

main();
