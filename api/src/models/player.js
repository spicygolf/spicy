import { aql } from 'arangojs';

import { searchPlayer as searchPlayerGhin } from '../ghin';
import { db } from '../db/db';
import { login } from '../util/ghin';
import { titleize } from '../util/text';
import { Club } from './club';
import { Doc } from './doc';
import { Game } from './game';
import { next } from '../util/database';

const collection = db.collection('players');

class Player extends Doc {
  constructor() {
    super(collection);
  }

  async getPlayer(pkey) {
    const player_id = `players/${pkey}`;
    const query = aql`
      FOR p IN players
        FILTER p._id == ${player_id}
        RETURN p
    `;
    return next({query});
  }

  async searchPlayer({ q, p }) {
    return searchPlayerGhin({
      token: null,
      q,
      p,
    });
  }

  // get the games this player is in
  // TODO: get only active, inactive, or all
  async games() {
    const pkey = this._doc._id;
    const cursor = await db.query(aql`
      FOR v, e
        IN 1..1
        ANY ${pkey}
        GRAPH 'games'
        FILTER e.type == 'player2game'
           AND v != null
        LET rounds = (
          FOR rv, re
              IN 1..1
              ANY v._id
              GRAPH 'games'
              FILTER re.type == 'round2game'
              RETURN MERGE(rv, {
                  handicap_index: re.handicap_index,
                  game_handicap: re.game_handicap,
                  course_handicap: re.course_handicap,
              })
      )
      SORT v.start DESC
      RETURN MERGE(v, {
        rounds: rounds
      })
  `);
    return cursor.all();
  }

  // get the gamespecs this player usually accesses
  // i.e. sorted by how many games they've played for each gamespec DESC
  async gamespecs() {
    const pkey = this._doc._id;
    const cursor = await db.query(aql`
      FOR gamespec in gamespecs
      LET player = (
          FOR player IN players
              FILTER player._id == ${pkey}
              RETURN player
      )
      LET player_count = (
          FOR v, e
              IN 2..2
              ANY ${pkey}
              GRAPH 'games'
              FILTER e.type == 'game2gamespec' AND v._id == gamespec._id
              RETURN v
      )
      FILTER gamespec.status IN player[0].statusAuthz
      RETURN {
          gamespec,
          player_count: LENGTH(player_count)
      }
    `);
    return cursor.all();
  }



  async loadByHandicap(h) {
    const query = aql`
      FOR p IN players
        FILTER p.handicap.source == ${h.source}
           AND p.handicap.id == ${h.id}
        RETURN p
    `;
    const cursor = await db.query(query, { maxRuntime: 5 });
    const results = await cursor.all();
    if (results.length > 1) {
      console.error(
        `Error: There are '${results.length}' players with handicap '${h}'.`,
      );
    }
    if (results && results[0]) {
      return results[0];
    }
    return null;
  }

  // overriding the function in doc.js
  async search(_field, q) {
    const search = aql`
      LET tokens = TOKENS(${q}, "text_en")
      LET prefix = LAST(tokens)
      LET words = POP(tokens)

      FOR doc IN v_players
        SEARCH
            ANALYZER( STARTS_WITH(doc.name, prefix) AND (LENGTH(words) == 0 OR PHRASE(doc.name, words)), "text_en")
        LET score = BM25(doc)
        SORT score DESC
        LIMIT 100
        RETURN doc
    `;
    const cursor = await db.query(search);
    return await cursor.all();
  }

  async register(player) {
    //console.log('player', JSON.stringify(player, null, ' '));
    let newPlayer = {};

    try {
      let ghinData = player.ghinData || [];
      let token = null;
      if (ghinData && ghinData.length > 0) {
        token = ghinData[0].NewUserToken;
      } else {
        const ret = await login(
          player.ghinNumber?.trim(),
          player.lastName?.trim(),
        );
        token = ret.token;
      }

      const ghinNumber =
        ghinData && ghinData.length ? ghinData[0].GHINNumber : null;

      // see if there's a player already claiming this ghin info
      const claimedQuery = aql`
        FOR p IN players
          FILTER p.email != null
             AND p.fbUser != null
             AND p.handicap.source == 'ghin'
             AND p.handicap.id == ${ghinNumber}
          RETURN p
      `;
      const claimedCursor = await db.query(claimedQuery);
      const claimed = await claimedCursor.next();
      //console.log('claimed', claimed);
      if (claimed) {
        if (claimed.email == player.email?.trim()) {
          // claimed and the same email, which shouldn't be possible with
          // firebase, so return a 409
          console.log('Player & email exists, so stopping.');
          return {
            error: {
              code: 409,
              message: 'Error registering player: Email already exists.',
            },
          };
        } else if (player.email) {
          console.log(`Player claimed but new email: ${player.email}`);
          // claimed but new email, so proceed, but delete the ghin stuffs
          delete player.handicap;
          delete player.ghinData;
          ghinData = [];
        } else {
          // do nothing - makes CLI --add-player-num-name call idempotent
        }
      }

      // see if there's already a player crawled, but not registered
      const existingQuery = aql`
        FOR p IN players
          FILTER p.email == null
             AND p.fbUser == null
             AND p.handicap.source == 'ghin'
             AND p.handicap.id == ${ghinNumber}
          RETURN p
      `;
      const existingCursor = await db.query(existingQuery);
      const existing = await existingCursor.next();
      //console.log('register existing', existing);
      if (existing) {
        //console.log('player exists already in our db');
        newPlayer = Object.assign(existing, player);
        delete newPlayer._rev;
      } else {
        newPlayer = Object.assign({}, player);
      }
      delete newPlayer.ghinData;

      // not sure this below 'if' statement works for registrations,
      // but does work for CLI --add-player-num-name call
      if (claimed && claimed.email && claimed.email !== newPlayer.email) {
        newPlayer = {
          ...claimed,
          handicap: player.handicap,
        };
      }

      if (!newPlayer.statusAuthz) newPlayer.statusAuthz = ['prod'];

      // trim whitespace off of all string fields, and make Title Case
      for (let [key, value] of Object.entries(newPlayer)) {
        if (typeof value === 'string') {
          newPlayer[key] = titleize(value.trim());
        }
      }

      // make sure all emails are lower case, to match firebase
      if (newPlayer.email) newPlayer.email = newPlayer.email.toLowerCase();

      // write new player to db
      this.set(newPlayer);
      const ret = await this.save({ overwrite: true });

      //console.log('register save ret', ret, ghinData);

      if (ret && ret._id && ghinData && ghinData.length) {
        // crawl this new player's club(s)
        let clubs = [];
        ghinData.map((gp) => {
          if (gp.Active == 'true') {
            clubs.push({
              club_id: gp.ClubId,
              name: gp.ClubName,
              assn: gp.Assoc,
              num: gp.Club,
            });
          }
        });
        clubs.map(async (club) => {
          console.log('register club', club);
          const c = new Club();
          await c.register(ret._id, club, token);
        });
      }
      return ret;
    } catch (err) {
      //console.log('register save error', err);
      if (err && err.response && err.response.body && err.response.body.error) {
        return {
          error: err.response.body,
        };
      }
      throw err;
    }
  }

  async getClubs(playerID) {
    const cursor = await db.query(aql`
      FOR v, e
          IN 1..1
          ANY ${playerID}
          GRAPH 'games'
          FILTER e.type == 'player2club'
          RETURN v
    `);
    return await cursor.all();
  }

  async getFavoritePlayersForPlayer(pkey) {
    const playerID = `players/${pkey}`;
    const cursor = await db.query(aql`
      FOR v, e
          IN 1..1
          OUTBOUND ${playerID}
          GRAPH 'games'
          FILTER e.type == 'player2player' AND e.favorite == 'true'
          RETURN DISTINCT(v)
    `);
    return await cursor.all();
  }

  async lookupPlayerByGhin(ghin) {
    const cursor = await db.query(aql`
      FOR p IN players
        FILTER p.handicap.source == 'ghin'
           AND p.handicap.id == ${ghin}
        RETURN p
    `);
    return await cursor.all();
  }

  async getPlayersFollowers(pkey) {
    const playerID = `players/${pkey}`;
    const cursor = await db.query(aql`
      FOR v, e
          IN 1..1
          INBOUND ${playerID}
          GRAPH 'games'
          FILTER e.type == 'player2player' AND e.favorite == 'true'
          RETURN DISTINCT(v)
    `);
    return await cursor.all();
  }

  async upsert_ghin(handicap, ghinNumber) {
    if (!ghinNumber) return;

    let newValue = {};
    const q = aql`
      FOR player IN players
        FILTER player.handicap.source == 'ghin'
        FILTER player.handicap.id == ${ghinNumber}
        RETURN player
    `;
    const cursor = await db.query(q);
    const existing = await cursor.next();

    if (existing) {
      newValue = {
        ...existing,
        handicap: handicap,
      };
      delete newValue._id;
      delete newValue._rev;
    } else {
      newValue = {
        name: handicap.playerName,
        handicap: handicap,
      };
    }

    this.set(newValue);
    return this.save({ overwrite: true });
  }

  /*
   *   merge source ( _key ) into target ( handicap data )
   *     Usually required when someone doesn't link handicap service at registration
   *     so they have an empty-ish user, and there is a handicap service player
   *     doc that should be them.  We want the hs player doc (target) to survive
   *     so we move all relevant registration info, esp. email and fbUser from the
   *     source doc.
   */
  async merge({ source, target }) {
    const ts = this.getTS();

    // load up the old Player document
    let oldDoc = await this.load(source._key);
    const old_id = oldDoc._id;

    // load the new Player document
    let newDoc = await this.loadByHandicap(target);
    newDoc = {
      ...newDoc,
      email: oldDoc.email,
      name: oldDoc.name,
      short: oldDoc.short,
      fbUser: oldDoc.fbUser,
      statusAuthz: oldDoc.statusAuthz,
      merged: {
        from: oldDoc._id,
        ts,
      },
    };
    const new_id = newDoc._id;
    delete newDoc._id;
    delete newDoc._rev;

    const game_keys = await this._getGamesForPlayer(old_id);
    await this._updatePlayerEdges({ old_id, new_id });
    await this._updatePlayerGames({ old_id, new_id, game_keys });

    // clean up old doc, leave only _key, name, and merge metadata
    oldDoc = {
      _key: oldDoc._key,
      name: oldDoc.name,
      merged: {
        to: new_id,
        ts,
      },
    };
    this.set(oldDoc);
    const old_res = await this.save({ overwrite: true });
    //console.log('oldDoc', oldDoc);
    //console.log('oldDoc res', old_res);

    // save new doc
    this.set(newDoc);
    const new_res = await this.save({
      overwrite: true,
      returnNew: true,
    });
    //console.log('newDoc', newDoc);
    //console.log('newDoc res', new_res);

    return new_res.new;
  }

  async getHandicap({ id }) {
    const resp = await searchPlayerGhin({
      q: {
        golfer_id: id,
      },
      p: {
        page: 1,
        per_page: 50,
      },
    });

    const golfer = resp[0] || {};
    const clubs = resp.map(g => ({
      id: g.club_id,
      name: g.club_name,
      state: g.state,
    }));

    return {
      index: golfer.hi_value,
      revDate: golfer.rev_date,
      gender: golfer.gender,
      clubs,
    }
  }

  async _getGamesForPlayer(player_id) {
    const q = aql`
      FOR v, e
        IN 1..1
        ANY ${player_id}
        GRAPH 'games'
        FILTER e.type == 'player2game'
        RETURN v._key
    `;
    const cursor = await db.query(q);
    return await cursor.all();
  }

  async _updatePlayerEdges({ old_id, new_id }) {
    // _to
    let q = aql`
      FOR e IN edges
        FILTER e._to == ${old_id}
        UPDATE { _key: e._key, _to: ${new_id} } IN edges
      `;
    let cursor = await db.query(q);
    const to_res = await cursor.all();

    // _from
    q = aql`
      FOR e IN edges
        FILTER e._from == ${old_id}
        UPDATE { _key: e._key, _from: ${new_id} } IN edges
      `;
    cursor = await db.query(q);
    const from_res = await cursor.all();
  }

  async _updatePlayerGames({ old_id, new_id, game_keys }) {
    const old_key = old_id.split('/')[1];
    const new_key = new_id.split('/')[1];
    game_keys.map(async (gkey) => {
      const gm = new Game();
      let g = await gm.load(gkey);
      g.holes = g.holes.map((h) => {
        h.teams = h.teams.map((t) => {
          const pI = t.players.indexOf(old_key);
          if (pI > -1) t.players[pI] = new_key;
          t.junk = t.junk.map((j) => {
            if (j.player == old_key) j.player = new_key;
            return j;
          });
          return t;
        });
        return h;
      });
      //console.log('g', JSON.stringify(g, null, 2));
      gm.set(g);
      const gm_res = await gm.save({ overwrite: true });
      //console.log('gm_res', gm_res);
    });
  }

  async removePlayerFromGame({ pkey, gkey, rkey }) {
    const pid = `players/${pkey}`;
    const gid = `games/${gkey}`;
    const rid = `rounds/${rkey}`;

    // start transaction
    const trx = await db.beginTransaction({ write: ['games', 'edges'] });
    let q;

    // remove player2game edge
    q = aql`
      FOR e IN edges
        FILTER e.type == 'player2game'
        FILTER e._from == ${pid}
        FILTER e._to == ${gid}
        REMOVE e IN edges
        RETURN 1
    `;
    const p2g = await trx.step(async () => db.query(q));

    // remove round2game edges
    q = aql`
      FOR e IN edges
        FILTER e.type == 'round2game'
        FILTER e._from == ${rid}
        FILTER e._to == ${gid}
        REMOVE e IN edges
        RETURN 1
    `;
    const r2g = await trx.step(async () => db.query(q));

    // remove player from:
    //   game.holes[*].teams[*].players
    //   game.holes[*].teams[*].junk
    q = aql`
      LET game = FIRST(FOR g IN games FILTER g._id == ${gid} RETURN g)
      LET holes = (
        FOR h IN game.holes
          LET teams = (
            FOR t IN h.teams
              LET players = (
                FOR p IN t.players
                  FILTER p != ${pkey}
                  RETURN p
              )
              LET junk = (
                FOR j IN t.junk
                  FILTER j.player != ${pkey}
                  RETURN j
              )
              RETURN MERGE(t, {players, junk})
          )
          RETURN MERGE(h, {teams})
      )
      UPDATE game WITH {holes} IN games
      RETURN NEW
    `;
    const g = await trx.step(async () => db.query(q));

    // commit transaction
    const result = await trx.commit();

    let messages = [];
    switch (result.status) {
      case 'aborted':
        messages = [
          {
            message: 'Error removing player from game: transaction aborted',
            p2g,
            r2g,
            g,
          },
        ];
    }

    return {
      success: result.status === 'committed',
      _key: gkey,
      messages,
    };
  }
}

export { Player };
