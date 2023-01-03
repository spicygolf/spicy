import { Doc } from './doc';
import { aql } from 'arangojs';
import datefnstz from 'date-fns-tz';
import { db } from '../db/db';
import { isEqual } from 'lodash-es';
import { refreshEdge } from '../util/ghin';

const { zonedTimeToUtc } = datefnstz;

const collection = db.collection('tees');

class Tee extends Doc {
  constructor() {
    super(collection);
  }

  async getCourse(tKey) {
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

  async getTeeForGame(gkey) {
    const gameID = `games/${gkey}`;
    const q = aql`
      FOR v, e
          IN 1..1
          ANY ${gameID}
          GRAPH 'games'
          FILTER e.type == 'game2tee'
          LIMIT 1
          RETURN v
    `;

    const cursor = await db.query(q);
    return cursor.all();
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
          SORT e.ts ASC
          RETURN v
    `);
    return await cursor.all();
  }

  async register(courseid, tee) {
    //console.log('register tee', courseid, tee);
    const now = this._getNowTS();

    let holes = [];
    tee.Holes.map((h) => {
      holes.push({
        hole: h.Number,
        hole_id: h.HoleId,
        length: h.Length,
        par: h.Par,
        handicap: h.Allocation,
      });
    });

    let newTee = {
      name: tee.TeeSetRatingName,
      gender: tee.Gender,
      holes: holes,
      tee_id: tee.TeeSetRatingId,
      HolesNumber: tee.HolesNumber,
      TotalYardage: tee.TotalYardage,
      TotalMeters: tee.TotalMeters,
      Ratings: tee.Ratings,
    };
    let new_p = false,
      changed_p = false;

    const existing = await this._getExistingTee(
      courseid,
      tee.TeeSetRatingName,
      tee.Gender,
    );
    if (existing) {
      // check to see if existing tee has changed any data
      if (this._existingTeeChanged(existing, newTee)) {
        changed_p = true;
        // set old tee to have expiration date
        if (!existing.effective) {
          existing.effective = {
            start: '2017-01-01T05:00:00Z',
            end: now,
          };
        } else {
          existing.effective.end = now;
        }
        delete existing._rev;
        delete existing._id;
        this.set(existing);
        const saveExisting = await this.save({ overwrite: true });
        //console.log('saveExisting res', saveExisting);
        // add effective date to newTee
        newTee.effective = {
          start: now,
          end: '',
        };
      } else {
        // no changes, set newTee key to existing's for overwrite
        changed_p = false;
        newTee._key = existing._key;
        newTee.effective = existing.effective;
      }
    } else {
      new_p = true;
      newTee.effective = {
        start: now,
        end: '',
      };
    }
    if (new_p || changed_p) {
      const type = new_p ? 'new' : 'changed';
      console.log(`register ${type} tee`, newTee);
    }
    //return;

    this.set(newTee);
    const ret = await this.save({ overwrite: true });

    if (ret && ret._id) {
      const teeid = ret._id;
      // refresh edge
      await refreshEdge('tee2course', teeid, courseid);
    }
  }

  async unregister(courseid, tee) {
    const now = this._getNowTS();
    console.log('unregister tee', courseid, tee, now);
    // set the tee.effective.end to now
    delete tee._id;
    delete tee._rev;
    if (!tee.effective) {
      tee.effective = {
        start: '2017-01-01T05:00:00Z',
        end: now,
      };
    } else {
      tee.effective.end = now;
    }
    this.set(tee);
    const saveExisting = await this.save({ overwrite: true });
    //console.log('saveExisting res', saveExisting);
  }

  async _getExistingTee(courseid, name, gender) {
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
