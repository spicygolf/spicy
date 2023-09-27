import axios, { AxiosResponse } from 'axios';

const { GHIN_BASE_URL } = process.env;
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

