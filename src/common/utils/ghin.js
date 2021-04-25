import { baseUri, scheme } from 'common/config';
import { build_qs } from 'common/utils/account';



export const login = async ({ghinNumber, lastName}) => {

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

export const search = async ({state, lastName, firstName, page, perPage}) => {

  const login_golfers = await login({
    ghinNumber: '1152839',
    lastName: 'Anderson'
  });
  if( !login_golfers || !login_golfers.length ) {
    console.log('Cannot log into GHIN');
    return [];
  }

  const qs = build_qs({
    state,
    lastName,
    firstName,
    page,
    perPage,
    token: login_golfers[0].NewUserToken,
  });

  const url = `${scheme}://${baseUri}/ghin/player/search?${qs}`;
  //console.log('url', url);
  const res = await fetch(url, {
    method: 'GET',
  });
  const ret = await res.json();
  if( ret && ret.golfers ) return ret.golfers;

  //console.log('No golfers returned');
  return [];

};
