import {
  crawlClub,
  getClubFacilities,
  login,
  refreshEdge,
} from '../util/ghin';

import { Course } from './course';
import { Doc } from './doc';
import { db } from '../db/db';

const collection = db.collection('clubs');

class Club extends Doc {
  constructor() {
    super(collection);
  }

  async register(pid, club, token) {
    //console.log('register club', pid, club);
    let newClub = Object.assign({}, club);
    newClub.name = newClub.name.trim();

    const existing = await this.find({
      name: club.name.trim(),
      assn: club.assn.toString(),
      num: club.num.toString(),
    });
    if( existing && existing.length ) newClub._key = existing[0]._key;

    this.set(newClub);
    const ret = await this.save({overwrite: true});

    if( ret && ret._id ) {
      newClub._id = ret._id;
      // make/refresh edges between player and club
      const clubid = ret._id;
      if( pid ) {
        console.log(`linking ${pid} to ${clubid}`);
        await refreshEdge('player2club', pid, clubid);
      }

      // get courses/facilities and their data
      const res = await this.getFacilities(club.club_id, token);
      // console.log('facilities', res);
      if( res && res.facilities && res.facilities.length ) {
        res.facilities.map(f => {
          if( f && f.home_courses && f.home_courses.length ) {
            f.home_courses.map(async course => {
              const c = new Course();
              await c.register(clubid, course, token);
            });
          }
        });
      }

      // crawl the rest of the members for this club
      // asynchronously, so do not await
      crawlClub(newClub, token, false);

    }

  }

  async getFacilities(club_id, token) {
    let t = token;
    if( !token ) {
      const login_res = await login();
      t = login_res.token;
    }
    const facilities = await getClubFacilities(club_id, t);
    return facilities;
  }

}

const _Club = Club;
export { _Club as Club };
