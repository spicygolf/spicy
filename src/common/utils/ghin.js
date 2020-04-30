import { baseUri, scheme } from 'common/config';
import { build_qs } from 'common/utils/account';



export const login = async (ghinNumber, lastName) => {

  const qs = build_qs({
    ghinNumber: ghinNumber,
    lastName: lastName,
  });

  const url = `${scheme}://${baseUri}/ghin/player/login?${qs}`;
  const res = await fetch(url, {
    method: 'GET',
  });
  const ret = await res.json();
  if( ret && ret.golfers ) return ret.golfers;

  //console.log('No golfers returned', ret);
  return [];

};

export const search = async (state, lastName, page, perPage) => {

  const login_golfers = await login('1152839', 'Anderson');
  if( !login_golfers || !login_golfers.length ) {
    console.log('Cannot log into GHIN');
    return [];
  }

  const qs = build_qs({
    state: state,
    lastName: lastName,
    page: page,
    perPage: perPage,
    token: login_golfers[0].NewUserToken,
  });

  const url = `${scheme}://${baseUri}/ghin/player/search?${qs}`;
  const res = await fetch(url, {
    method: 'GET',
  });
  const ret = await res.json();
  if( ret && ret.golfers ) return ret.golfers;

  //console.log('No golfers returned');
  return [];

};
