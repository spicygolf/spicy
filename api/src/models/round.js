import { login, postRound } from '../util/ghin';

import { Doc } from './doc';
import { aql } from 'arangojs';
import { db } from '../db/db';
import { getTee as getTeeGRPC } from '../clients/handicap';
import { next } from '../util/database';

const collection = db.collection('rounds');

class Round extends Doc {
  constructor() {
    super(collection);
  }

  async getTees(round) {
    if (!round?.tees) return [];
    try {
      const ret = await Promise.all(
        round.tees.map(
          async (tee) =>
            await getTeeGRPC({
              q: {
                source: 'ghin',
                tee_id: tee.tee_id,
              },
            }),
        ),
      );
      return ret;
    } catch (e) {
      console.error('error', e);
    }
  }

  async getPlayer(rkey) {
    const round = 'rounds/' + rkey;

    const playerInRound = aql`
      FOR v, e
        IN 1..1
        ANY ${round}
        GRAPH 'games'
        FILTER e.type == 'round2player'
        RETURN v
    `;

    const cursor = await db.query(playerInRound);
    return cursor.all();
  }

  async getPlayer0(rkey) {
    const arr = await this.getPlayer(rkey);
    return arr[0];
  }

  async getCourseTee(rkey) {
    console.error(
      "api/src/models/round.js/getCourseTee needs refactoring b/c there's no more tee2course edges - see #37",
    );
    const round = 'rounds/' + rkey;

    const teeCourse = aql`
    FOR tv, te
    IN 1..1
        ANY ${round}
        GRAPH 'games'
        FILTER te.type == 'round2tee'
        LET course = (
            FOR cv, ce
            IN 1..1
            ANY tv._id
            GRAPH 'games'
            FILTER ce.type == 'tee2course'
            RETURN cv
        )
        RETURN { tee: tv, course: FIRST(course)}
    `;
    const cursor = await db.query(teeCourse);
    return cursor.next();
  }

  // pretty convoluted, but handles a shit-ton of writes at once with ArangoDB
  // transactions surrounding the read of old docs before writing new ones.
  async postScore(round, score) {
    const action = String(function (params) {
      const db = require('@arangodb').db;

      let doc = Object.assign({}, db.rounds.document(params.round));
      let scoreExisted = false;

      // loop through old scores
      for (let i = 0; i < doc.scores.length; i++) {
        let oldscore = doc.scores[i];
        let newscore = params.score;
        if (oldscore.hole == newscore.hole) {
          // found the new score hole within old score holes,
          // so add/overwrite w new score
          scoreExisted = true;

          // loop thru new values
          for (let j = 0; j < newscore.values.length; j++) {
            let valueExisted = false;
            // loop thru old values to see if new value key is there
            for (let l = 0; l < oldscore.values.length; l++) {
              if (oldscore.values[l].k == newscore.values[j].k) {
                // found the new value key within old values,
                // so overwrite w new value and date
                valueExisted = true;
                oldscore.values[l].v = newscore.values[j].v;
                oldscore.values[l].ts = newscore.values[j].ts;
              }
            }
            if (!valueExisted) {
              // new value wasn't present in old values so add it
              oldscore.values.push({
                k: newscore.values[j].k,
                v: newscore.values[j].v,
                ts: newscore.values[j].ts,
              });
            }
          }
          doc.scores[i] = oldscore;
        }
      }
      if (!scoreExisted) {
        // new score wasn't present in old scores so add it
        doc.scores.push(params.score);
      }

      return db.rounds.replace(params.round, doc, {
        overwrite: true,
        returnNew: true,
      });
    });

    const ret = await db.transaction(
      {
        write: 'rounds',
      },
      action,
      {
        round: round,
        score: score,
      },
    );
    //console.log('postScore ret', ret.new.scores);
    return ret.new;
  }

  async getRoundsForPlayerDay(pkey, day) {
    const playerID = `players/${pkey}`;
    const cursor = await db.query(aql`
      FOR v, e
        IN 1..1
        ANY ${playerID}
        GRAPH 'games'
        FILTER e.type == 'round2player'
          AND DATE_COMPARE(v.date, ${day}, "years", "days")
        LET tee = (
          FOR tv, te
          IN 1..1
          ANY v._id
          GRAPH 'games'
          FILTER te.type == 'round2tee'
          RETURN MERGE(tv, {assigned: te.assigned})
        )
        RETURN MERGE(v,{tee: FIRST(tee)})
  `);
    return await cursor.all();
  }

  async postRoundToHandicapService(rkey, posted_by) {
    const round = await this.load(rkey);
    const player = await this.getPlayer0(rkey);
    const { course, tee } = await this.getCourseTee(rkey);
    const service = this.getService(player);

    let posting = {
      success: false,
      messages: [],
    };

    let resp;
    switch (service) {
      case 'ghin':
        const { token } = await login(
          player.handicap.id,
          player.handicap.lastName,
        );
        resp = await postRound({ player, round, course, tee, token });
        if (
          resp &&
          resp.score &&
          resp.score.status &&
          resp.score.status.toLowerCase() == 'validated'
        ) {
          posting.success = true;
          posting.messages.push(
            'Posting Round to GHIN handicap service succeeded.',
          );
          posting = {
            ...posting,
            id: resp.score.id,
            adjusted_gross_score: resp.score.adjusted_gross_score,
            differential: resp.score.differential,
            date_validated: resp.score.date_validated,
            exceptional: resp.score.exceptional,
            estimated_handicap: resp.score.estimated_handicap,
            posted_by,
          };
        } else {
          // TODO: handle errors, or at least add some errors to messages array
          console.error(resp);
          console.error('TODO: add ^^^^ error(s) to messages array');
          messages.push(
            'Posting round to handicap service failed.  Please post manually.',
          );
        }
        break;
      default:
    }

    this._doc.posting = posting;
    await this.update(this._doc);

    return {
      _key: rkey,
      posting,
    };
  }

  getService(player) {
    if (player && player.handicap && player.handicap.source)
      return player.handicap.source.toLowerCase();
    return null;
  }

  /**
    This will add a tee/course object to the `tees` array element of the round document.
    note: unique is set to true, so if it's already there, this is basically a no-op
  */
  async addTeeToRound({ rkey, course_id, tee_id, course_handicap }) {
    const round_id = `rounds/${rkey}`;
    const mutation = aql`
        LET existing = FIRST(FOR r IN rounds FILTER r._id == ${round_id} RETURN r)
        UPDATE existing WITH {
            tees: PUSH(existing.tees, {
              course_id: ${course_id},
              tee_id: ${tee_id},
              course_handicap: ${course_handicap || null}
            }, true) // unique = true
        } IN rounds
        RETURN NEW
      `;
    return next(mutation, {}, true);
  }

  /**
    This will remove a tee/course object from the `tees` array element of the round document.
  */
  async removeTeeFromRound({ rkey, course_id, tee_id, course_handicap }) {
    const round_id = `rounds/${rkey}`;
    const mutation = aql`
      LET existing = FIRST(FOR r IN rounds FILTER r._id == ${round_id} RETURN r)
      UPDATE existing WITH {
          tees: REMOVE_VALUE(existing.tees, {
            course_id: ${course_id},
            tee_id: ${tee_id},
            course_handicap: ${course_handicap || ""}
          })
      } IN rounds
      RETURN NEW
    `;
    return next(mutation, {}, true);
  }
}

const _Round = Round;
export { _Round as Round };
