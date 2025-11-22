import { Doc } from './doc';
import { aql } from 'arangojs';
import { db } from '../db/db';
import { next } from '../util/database';
import { getTee as getTeeGhin, searchPlayer } from '../ghin';

const collection = db.collection('rounds');

class Round extends Doc {
  constructor() {
    super(collection);
  }

  async getTees(round) {
    // Fetch tees from round2tee edges in the graph
    const roundID = `rounds/${round._key}`;

    const cursor = await db.query(aql`
      FOR tv, te
        IN 1..1
        OUTBOUND ${roundID}
        GRAPH 'games'
        FILTER te.type == 'round2tee'
        SORT te.ts DESC
        LIMIT 1
        LET course = FIRST(
          FOR cv, ce
            IN 1..1
            ANY tv._id
            GRAPH 'games'
            FILTER ce.type == 'tee2course'
            RETURN cv
        )
        LET gameEdge = FIRST(
          FOR e IN edges
            FILTER e._from == ${roundID}
              AND e.type == 'round2game'
            RETURN e
        )
        RETURN MERGE(tv, {
          tee_name: tv.name,
          total_yardage: tv.TotalYardage,
          total_meters: tv.TotalMeters,
          total_par: tv.TotalPar,
          holes_number: tv.HolesNumber,
          ratings: tv.Ratings,
          holes: tv.holes ? (
            FOR h IN tv.holes
              RETURN {
                number: h.hole,
                hole_id: h.hole_id,
                length: h.length,
                par: h.par,
                allocation: h.handicap
              }
          ) : [],
          course_handicap: gameEdge ? gameEdge.course_handicap : null,
          game_handicap: gameEdge ? gameEdge.game_handicap : null,
          course: course ? {
            course_id: course.course_id,
            course_name: course.name,
            course_city: course.city,
            course_state: course.state,
            course_number: course.number,
            course_status: course.status
          } : null
        })
    `);

    return await cursor.all();
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
    return;

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
    console.error('TODO: rework postRoundToHandicapService');
    return;

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
  */
  async addTeeToRound({ rkey, course_id, tee_id, course_handicap }) {
    // send in a minimal round object to getTees that are decorated with GHIN info
    const newTees = await this.getTees({
      tees: [{
        course_id,
        tee_id,
        course_handicap,
      }],
    });

    const round_id = `rounds/${rkey}`;
    const query = aql`
        LET existing = FIRST(FOR r IN rounds FILTER r._id == ${round_id} RETURN r)
        UPDATE existing WITH {
            tees: ${newTees}
        } IN rounds
        RETURN NEW
      `;
    return next({query});
  }

  /**
    This will remove a tee/course object from the `tees` array element of the round document.
  */
  async removeTeeFromRound({ rkey, tee_id }) {
    const round_id = `rounds/${rkey}`;
    const query = aql`
      LET existing = FIRST(FOR r IN rounds FILTER r._id == ${round_id} RETURN r)
      LET newTees = (
        FOR tee IN existing.tees
          FILTER tee.tee_id != ${tee_id}
          RETURN tee
      )
      UPDATE existing WITH {
          tees: newTees
      } IN rounds
      RETURN NEW
    `;
    return next({query, debug: true});
  }
}

/**
 * Links round to appropriate other vertices via edges.
 * This is an all-in-one ArangoDB query and is easier on the client.
 *
 * @param {any} _ parent document from graphql query - unused
 * @param {object} args arguments supplied from graphql query
 * @returns
 */
export const linkRound = async (_, args) => {
  const { gkey, player, isNewRound, round, newHoles, currentPlayerKey } = args;
  const gid = `games/${gkey}`;
  const pid = `players/${player._key}`;
  const hi = await getHandicap(player);
  let q, cursor;

  // start transaction
  const trx = await db.beginTransaction({ write: ['games', 'rounds', 'edges']});

  try {

    // link player to game
    q = aql`
      LET p2g = {
          _from: ${pid},
          _to: ${gid},
          type: "player2game",
          ts: DATE_ISO8601(DATE_NOW()),
          by: ${currentPlayerKey}
      }
      UPSERT { _from: ${pid}, _to: ${gid} }
      INSERT p2g
      REPLACE p2g
      IN edges
    `;
    const p2g = await trx.step(async () => db.query(q));

    // update game with new teams (on the 'holes' key)
    q = aql`
      UPDATE {_key: ${gkey}, holes: ${newHoles}} IN games
    `;
    const g = await trx.step(async () => db.query(q));

    // insert new round or set to supplied round
    let r;
    if (isNewRound) {
      q = aql`
        INSERT ${round} INTO rounds RETURN NEW
      `;
      cursor = await trx.step(async () => db.query(q));
      r = await cursor.next();
    } else {
      r = round;
    }
    const rid = `rounds/${r._key}`;

    // link round to game
    q = aql`
      LET r2g = {
          _from: ${rid},
          _to: ${gid},
          type: "round2game",
          ts: DATE_ISO8601(DATE_NOW()),
          by: ${currentPlayerKey},
          handicap_index: ${hi}
      }
      UPSERT { _from: ${rid}, _to: ${gid} }
      INSERT r2g
      REPLACE r2g
      IN edges
    `;
    const r2g = await trx.step(async () => db.query(q));

    // link round to player
    q = aql`
      LET r2p = {
          _from: ${rid},
          _to: ${pid},
          type: "round2player",
          ts: DATE_ISO8601(DATE_NOW()),
          by: ${currentPlayerKey}
      }
      UPSERT { _from: ${rid}, _to: ${pid} }
      INSERT r2p
      REPLACE r2p
      IN edges
    `;
    const r2p = await trx.step(async () => db.query(q));

    // commit transaction
    const result = await trx.commit();

    let message = '';
    switch (result.status) {
      case 'aborted':
        message = JSON.stringify(
          {
            message: 'Error linking round: transaction aborted',
            p2g,
            g,
            r2g,
            r2p,
          }, null, 2
        );
    }

    return {
      success: result.status === 'committed',
      _key: r._key,
      message,
    };
  } catch (e) {
    console.error(e);
    trx.abort();
    return {
      success: false,
      _key: null,
      message: e.message,
    };
  }
};

const getHandicap = async (player) => {
  if (player?.handicap?.index) {
    return player.handicap.index;
  }

  if (player?.handicap?.id) {
    const search = await searchPlayer({
      q: {
        golfer_id: player.handicap.id,
      },
      p: {
        page: 1,
        perPage: 50,
      },
    });

    if (search[0] && search[0].hi_display) {
      return search[0].hi_display;
    }
  }

  // didn't find anything
  console.error('models/round.js getHandicap - error no data', player);
  return '';
};

const _Round = Round;
export { _Round as Round };
