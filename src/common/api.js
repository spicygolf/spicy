import { baseUrl } from 'common/config';


export function get(uri, dispatchFn) {
  try {
    fetch(baseUrl + uri).then(resp => {
      if( resp.status === 200 ) {
        return resp.json().then((json) => dispatchFn(json));
      } else {
        console.log('data not fetched');
      }
      return null;
    }).catch((error) => {
      console.error(error);
    });
  } catch(error) {
    console.error(error);
  }
};


export function post(uri, body, dispatchFn) {
  try {
    fetch(baseUrl + uri, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(resp => {
      return resp.json().then((json) => dispatchFn(json));
    }).catch((error) => {
      console.error(error);
    });
  } catch(error) {
    console.error(error);
  }

};
