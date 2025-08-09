import axios, { type AxiosResponse } from "axios";
import { getMockResponse, isMockingEnabled } from "./mock";
import type { GhinRequestFn } from "./types";

const { GHIN_BASE_URL, GHIN_TOKEN, _GHIN_USERNAME, _GHIN_PASSWORD } = process.env;
// le sigh, global :(
const retries: number = 3;
let ghinToken: string | undefined;

const instance = axios.create({
  baseURL: GHIN_BASE_URL,
  timeout: 10000, // ms
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const ghinRequest: GhinRequestFn = async ({
  method,
  url,
  params,
  data,
  attempts,
}) => {
  if (!ghinToken) {
    ghinToken = await login();
  }

  attempts++;

  if (attempts > retries) {
    throw `retries exceeded ${retries}`;
  }

  const headers = ghinToken
    ? {
        Authorization: `Bearer ${ghinToken}`,
      }
    : {};

  console.log("ghin request", url, params, data);

  // Check if mocking is enabled and return mock response
  if (isMockingEnabled()) {
    const mockResponse = getMockResponse({
      method,
      url,
      params,
      data,
      attempts,
    });
    if (mockResponse) {
      return mockResponse;
    }
    console.warn(
      "Mock enabled but no mock data found, falling back to real API",
    );
  }

  try {
    const resp: AxiosResponse = await instance.request({
      method,
      url,
      params,
      data,
      headers,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors, only 5xx
    });

    switch (resp.status) {
      case 200: // ok
        return resp;
      case 401: // unauthorized
        // reset token to force another login
        ghinToken = undefined;
        return await ghinRequest({ method, url, params, data, attempts });
      default:
        console.error("ghin response statusText", resp.statusText);
        console.log("ghin response", resp);
    }
    return null;
  } catch (error) {
    console.error({ method, url, params, data, error });
  }
};

const login = async (): Promise<string | undefined> => {
  // Get this from ghin.com website after logging in
  return GHIN_TOKEN;

  // // or use this after access to sandbox/uat is granted
  // const resp = await instance.request({
  //   method: 'post',
  //   url: '/users/login.json',
  //   data: {
  //     user: {
  //       email: GHIN_USERNAME,
  //       password: GHIN_PASSWORD,
  //       remember_me: true,
  //     }
  //   },
  // });
  // console.log("ghin login", resp?.data);
  // return resp?.data?.token || undefined;
};
