import { aql } from 'arangojs';
import datefnstz from 'date-fns-tz';
import { isEqual } from 'lodash-es';

import { db } from '../db/db';
import { Doc } from './doc';

const { zonedTimeToUtc } = datefnstz;

const collection = db.collection('tees');

class Tee extends Doc {
  constructor() {
    super(collection);
  }

  async getCourse(tKey) {
    console.error('TODO: refactor models/tee/getCourse');
    return;
    const teeID = `tees/${tKey}`;
    //console.log('teeID', teeID);
    const q = aql`
      FOR v, e
          IN 1..1
          ANY ${teeID}
          GRAPH 'games'
          FILTER e.type == 'tee2course'
          LIMIT 1
          RETURN v
    `;
    const cursor = await db.query(q);
    return cursor.next();
  }

  async getFavoriteTeesForPlayer(pkey, gametime) {
    const playerID = `players/${pkey}`;
    const gameTS = gametime ? gametime : zonedTimeToUtc(new Date());

    const cursor = await db.query(aql`
      FOR v, e
          IN 1..1
          ANY ${playerID}
          GRAPH 'games'
          FILTER e.type == 'player2tee'
           AND e.favorite == 'true'
           AND (
            (
              (IS_DATESTRING(v.effective.start) AND DATE_TIMESTAMP(v.effective.start) <= DATE_TIMESTAMP(${gameTS}))
              OR NOT IS_DATESTRING(v.effective.start)
            )
            AND
            (
              (IS_DATESTRING(v.effective.end) AND DATE_TIMESTAMP(v.effective.end) > DATE_TIMESTAMP(${gameTS}))
              OR NOT IS_DATESTRING(v.effective.end)
            )
          )
          LET course = FIRST(
            FOR c, ce
              IN 1..1
              ANY v._id
              GRAPH 'games'
              FILTER ce.type == 'tee2course'
              RETURN c
          )
          SORT e.ts ASC
          RETURN MERGE(v, {
            tee_name: v.name,
            total_yardage: v.TotalYardage,
            total_meters: v.TotalMeters,
            ratings: v.Ratings,
            holes_number: v.HolesNumber,
            course: course ? {
              course_id: course.course_id,
              course_name: course.name,
              course_city: course.city,
              course_state: course.state
            } : null
          })
    `);
    return await cursor.all();
  }



  async _getExistingTee(courseid, name, gender) {
    console.error('TODO: refactor models/tee/_getExistingTee');
    return;
    const q = aql`
      FOR v, e
        IN 1..1
        ANY ${courseid}
        GRAPH 'games'
        FILTER e.type == 'tee2course'
          AND v.name == ${name}
          AND v.gender == ${gender}
        SORT v.effective.start DESC
        RETURN v
    `;
    const cursor = await db.query(q);
    return cursor.next();
  }

  _existingTeeChanged(oldTee, newTee) {
    if (newTee.tee_id != oldTee.tee_id) return true;
    if (!isEqual(newTee.Ratings, oldTee.Ratings)) return true;
    if (!isEqual(newTee.holes, oldTee.holes)) return true;
    return false;
  }

  _getNowTS() {
    const utcDate = zonedTimeToUtc(new Date(), 'America/New_York');
    const now = utcDate.toISOString();
    return now;
  }
}

const _Tee = Tee;
export { _Tee as Tee };
