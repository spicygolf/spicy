import { ghin_request } from './ghin';

export const login = async ({email, password, remember_me}): Promise<string | null> => {

  const resp = await ghin_request({
    method: 'post',
    url: '/users/login.json',
    data: {
      user: {
        email,
        password,
        remember_me,
      }
    },
    token: null,
    attempts: 0,
  });

  return resp?.data?.token || null;

};
