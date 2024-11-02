import axios, { AxiosResponse } from 'axios';

const { GHIN_BASE_URL, GHIN_EMAIL, GHIN_PASS } = process.env;
// le sigh, global :(
const retries: number = 3;
let ghinToken: string | undefined = undefined;

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

export type Pagination = {
  page: number;
  per_page: number;
};

export const ghinRequest = async ({method, url, params, data, attempts}: GhinRequest) => {
  if (!ghinToken) {
    ghinToken = await login()
  }

  attempts++;

  if (attempts > retries) {
    console.error({method, url, params, data, error: `retries exceeded ${retries}`});
    return null;
  }

  const headers = ghinToken ? {
    Authorization: `Bearer ${ghinToken}`
  } : {};

  console.log('ghin request', url, params, data)
  try {
    const resp: AxiosResponse = await instance.request({
      method,
      url,
      params,
      data,
      headers,
    });

    switch (resp.status) {
      case 200: // ok
        return resp;
      case 401: // unauthorized
        // reset token to force another login
        ghinToken = undefined;
        return await ghinRequest({method, url, params, data, attempts});
      default:
        console.error("ghin response statusText", resp.statusText);
        console.log('ghin response', resp);
    }
    return null;
  } catch(error) {
    console.error({method, url, params, data, error});
  }
};

const login = async (): Promise<string | undefined> => {
  // Get this from ghin.com website after logging in
  const { GHIN_TOKEN } = process.env;
  return GHIN_TOKEN;

  // or use this after access to sandbox/uat is granted
  const resp = await instance.request({
    method: 'post',
    url: '/users/login.json',
    data: {
      user: {
        email: GHIN_EMAIL,
        password: GHIN_PASS,
        remember_me: true,
      }
    },
  });
  console.log("ghin login");
  return resp?.data?.token || undefined;
};
