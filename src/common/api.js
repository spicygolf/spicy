import { baseUrl } from 'common/config';


export function get(uri) {

  try {
    return new Promise((resolve, reject) => {
      fetch(baseUrl + uri)
        .then(resp => {
          if( resp.status === 200 ) {
            resolve(resp.json());
          } else {
            reject('data not fetched');
          }
        })
        .catch((error) => {
          console.error(error);
          reject('error, ' + error);
        });
    });
  } catch(error) {
    console.error(error);
  }

};


export function post(uri, body) {
  try {
    return new Promise((resolve, reject) => {
      fetch(baseUrl + uri, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
        .then(resp => {
          if( resp.status === 200 ) {
            resolve(resp.json());
          } else {
            reject('data not posted');
          }
        })
        .catch((error) => {
          console.error(error);
          reject('error, ' + error);
        });
    });
  } catch(error) {
    console.error(error);
  }

};
