import { aql } from 'arangojs';
import { find } from 'lodash-es';

import { db } from '../db/db';
// import { pubsub } from '../server';
import { Doc } from './doc';

const collection = db.collection('games');
const GAME_UPDATED = 'GAME_UPDATED';



class Game extends Doc {
  constructor() {
    super(collection);
  }

  async find(name) {
    const cursor = await this._collection.byExample({ name: name });
    return cursor.all();
  }

  async search(q) {
    return this._collection.fulltext('name', q);
  }

  async updateGame(gkey, game) {
    const oldGame = await this.load(gkey);
    //console.log('oldGame', oldGame);
    const newG = {
      _id: oldGame._id,
      _key: oldGame._key,
      _rev: oldGame._rev,
      ...game
    };
    //console.log('newG', newG);
    return this._updateGame(newG);
  }

  async updateGameHoles(gkey, holes) {
    const oldGame = await this.load(gkey);
    let newG = {
      ...oldGame,
      holes,
    };
    return this._updateGame(newG);
  }

  async updateGameScope(gkey, scope) {
    const oldGame = await this.load(gkey);
    let newG = {
      ...oldGame,
      scope,
    };
    return this._updateGame(newG);
  }

  async _updateGame(newG) {
    // write to db
    const newGame = await this.update(newG, {returnNew: true});

    // // publish changes for subscriptions
    // pubsub.publish(GAME_UPDATED, {
    //   gameUpdated: newG,
    // });
    //console.log('_updateGame output', newGame.new);
    return newGame.new;
  }

  async query(gkey) {
    const gid = `games/${gkey}`;

    const getGameQuery = aql`
      FOR g IN games
        FILTER g._id == ${gid}
        LET rounds = (
            FOR rv, re
                IN 1..1
                ANY g._id
                GRAPH 'games'
                FILTER re.type == 'round2game' AND rv != null
                LET tee = (
                    FOR tv, te
                    IN 1..1
                    ANY rv._id
                    GRAPH 'games'
                    FILTER te.type == 'round2tee'
                    RETURN MERGE(tv, {
                        assigned: te.assigned
                    })
                )
                RETURN MERGE(rv, {
                    handicap_index: re.handicap_index,
                    game_handicap: re.game_handicap,
                    course_handicap: re.course_handicap,
                    tee: FIRST(tee)
                })
        )
        LET players = (
          FOR pv, pe
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER pe.type == 'player2game'
              RETURN pv
        )
        LET gamespecs = (
          FOR gsv, gse
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER gse.type == 'game2gamespec'
              LET options = (
                FOR ov, oe
                    IN 1..1
                    ANY gsv._id
                    GRAPH 'games'
                    FILTER oe.type == 'option2gamespec'
                    RETURN MERGE(ov, {
                      default: oe.default ? oe.default : ov.default,
                      values: oe.values ? oe.values : ov.values
                    })
              )
              RETURN MERGE(gsv, {options})
        )
        RETURN MERGE(g, {
          rounds: rounds,
          players: players,
          gamespecs: gamespecs
        })
    `;

    const cursor = await db.query(getGameQuery);
    const game = await cursor.next(); // only return one, so use 'next' for this.
    const gameWithPops = this._calculatePops(game);
    // console.log('getGame', JSON.stringify(gameWithPops, null, 2));
    return gameWithPops;
  }

  _calculatePops(game) {

    let lowIndex = null;
    let handicapIndexFrom = null;
    const useHandicapsOption = this._getOption(game, 'use_handicaps');
    if( useHandicapsOption.value ) {
      handicapIndexFrom = this._getOption(game, 'handicap_index_from');
      if( handicapIndexFrom && handicapIndexFrom.value == 'low' ) {
        lowIndex = this._getLowIndex(game);
      }
    }
    /*
    console.log('use_handicaps option', useHandicapsOption);
    console.log('handicap_index_from option', handicapIndexFrom);
    console.log('lowIndex', lowIndex);
    */
    const newRounds = game.rounds.map(r => {
      // if no tee information, can't calculate strokes/pops
      if( !(r && r.tee && r.tee.holes) ) return r;

      // player's handicap for this game
      const hdcp = (
        r.game_handicap
          ? r.game_handicap
          : (r.course_handicap || '0')
      ) - lowIndex;

      let newR = { ...r, scores: [] };

      // loop thru the tee holes and add pops
      // TODO: this assumes r.tee.holes is complete
      // ^ may want to detect if we have r.scores holes that aren't in r.tee.holes
      r.tee.holes.map(tHole => {
        const pops = useHandicapsOption.value
          ? this._getPops(tHole.handicap, hdcp)
          : "0";
        const coursePops = this._getPops(tHole.handicap, r.course_handicap || '0');
        let rHole = find(r.scores, { hole: tHole.hole.toString()});
        if( !rHole ) {
          rHole = {hole: tHole.hole, values: [], pops, coursePops}
        } else {
          rHole.pops = pops;
          rHole.coursePops = coursePops;
        }
        newR.scores.push(rHole);
      });

      return newR;
    });
    return {
      ...game,
      rounds: newRounds
    };

  }

  _getPops(tHoleHdcp, rPlayerHdcp) {
    const holeHdcp = parseFloat(tHoleHdcp);
    const playerHdcp = parseFloat(rPlayerHdcp);

    // no or weird hole handicap, so return no pops
    if( holeHdcp < 1 || holeHdcp > 18 ) return 0;

    let basePops = 0;
    if( playerHdcp >= 0 ) {
      basePops = Math.floor(playerHdcp / 18);
    } else {
      basePops = Math.ceil(playerHdcp / 18);
    }
    const remPops = playerHdcp % 18;

    let pop = 0;
    if( playerHdcp >= 0 ) pop = ( holeHdcp <= remPops ) ? 1 : 0;
    if( playerHdcp < 0 ) pop = ( (18-holeHdcp) < (-1*remPops) ) ? -1 : 0;
    const holePops = basePops + pop;
    //console.log(holeHdcp, playerHdcp, basePops, remPops, pop, holePops);
    return holePops;
  }

  _getLowIndex(game) {
    let lowIndex = 0.0;
    game.rounds.map((r, i) => {
      if( !r ) return lowIndex; // edge case when round has been deleted, but not the round2game edge
      const hdcp = r.game_handicap ? r.game_handicap : (r.course_handicap || 0);
      if( i == 0 ) lowIndex = hdcp; // set initial lowIndex from first round
      if( parseFloat(hdcp) < lowIndex ) lowIndex = hdcp;
    });
    return lowIndex;
  }

  _getOption(game, option) {
    // first get list of all gamespec options linked to this game
    let allGSoptions = [];
    if( !game || !game.gamespecs ) return [];
    game.gamespecs.map(gs => {
      gs.options.map(o => {
        allGSoptions.push(o);
      });
    });

    // TODO: this will only find the first one.  If the same option exists in
    // two different gamespecs linked to this game, /shrug
    const gso = find(allGSoptions, {name: option});
    let v = ( gso && gso.default ) ? gso.default : null;
    //console.log('1', gso, null, v);

    const go = find(game.options, {name: option});
    if( go && go.value ) v = go.value;
    //console.log('2', gso, go, v);

    // convert bool
    if( (gso && gso.type == 'bool') ) {
      v = (v === true || v === 'true');
    }
    //console.log('3', gso, go, v);

    return {
      name: option,
      value: v,
    };
  }

  async getDeleteGameInfo(game_id) {
    const getGameQuery = aql`
      FOR g IN games
      FILTER g._id == ${game_id}
      LET rounds = (
          FOR rv, re
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER re.type == 'round2game' AND rv != null
              LET otherGames = (
                  FOR ogv, oge
                      IN 1..1
                      ANY rv._id
                      GRAPH 'games'
                      FILTER oge.type == 'round2game'
                      FILTER ogv._id != ${game_id}
                      FILTER ogv._id != NULL
                      RETURN ogv._id
              )
              RETURN {vertex: rv._key, edge: re._id, other: otherGames}
      )
      LET players = (
          FOR pv, pe
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER pe.type == 'player2game'
              RETURN {vertex: pv._key, edge: pe._id, other: []}
      )
      LET gamespecs = (
          FOR gsv, gse
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER gse.type == 'game2gamespec'
              RETURN {vertex: gsv._key, edge: gse._id, other: []}
      )
      RETURN {rounds: rounds, players: players, gamespecs: gamespecs}

    `;
    const cursor = await db.query(getGameQuery);
    return await cursor.next(); // only return one, so use 'next' for this.
  }

  async statForPlayerFeed({ begDate, endDate, stat, currentPlayer, myClubs }) {
    let query, cursor;
    switch(stat) {
      case 'public':
        query = `
        FOR g IN games
          FILTER g.start > '${begDate}' AND g.start < '${endDate}'
          COLLECT WITH COUNT INTO length
          RETURN length
        `;
        cursor = await db.query(query);
        break;
      case 'myclubs':
        query = `
        FOR g IN games
          FILTER g.start > '${begDate}' AND g.start < '${endDate}'
          LET players = (
            FOR pv, pe
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER pe.type == 'player2game'
              LET myclubs = (
                /*
                FOR cv, ce
                  IN 1..1
                  ANY pv._id
                  GRAPH 'games'
                  FILTER ce.type == 'player2club'
                    AND CONTAINS(@myClubs, ce._to)
                */
                  RETURN true
              )
              RETURN POSITION(myclubs, true)
          )
          FILTER POSITION(players, true)
          COLLECT WITH COUNT INTO length
          RETURN length
        `;
        cursor = await db.query(query, {myClubs});
        break;
      case 'faves':
        query = `
        FOR g IN games
        FILTER g.start > '${begDate}' AND g.start < '${endDate}'
          LET players = (
            FOR pv, pe
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER pe.type == 'player2game'
              LET fave = (
                FOR fv, fe
                  IN 1..1
                  ANY pv._id
                  GRAPH 'games'
                  FILTER fe.type == 'player2player'
                    AND fe.favorite == "true"
                    AND fe._from == '${currentPlayer}'
                    AND fe._to == pv._id
                  RETURN fv._id
              )
              RETURN CONTAINS(fave, '${currentPlayer}')
          )
          FILTER POSITION(players, true)
          COLLECT WITH COUNT INTO length
          RETURN length
        `;
        cursor = await db.query(query);
        break;
      case 'me':
        query = `
        FOR g IN games
        FILTER g.start > '${begDate}' AND g.start < '${endDate}'
          LET players = (
            FOR pv, pe
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER pe.type == 'player2game'
              LET me = ( pv._id == '${currentPlayer}' )
              RETURN me
          )
          FILTER POSITION(players, true)
          COLLECT WITH COUNT INTO length
          RETURN length
        `;
        cursor = await db.query(query);
        break;
    }
    //console.log('query', query);
    return await cursor.all();
  }

  async gamesForPlayerFeed({ stat, begDate, endDate, currentPlayer, myClubs }) {
    let query, cursor;
    switch(stat) {
      case 'public':
        query = `
        FOR g IN games
          FILTER g.start > '${begDate}' AND g.start < '${endDate}'
          LET rounds = (
            FOR rv, re
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER re.type == 'round2game' AND rv != null
              LET tee = (
                FOR tv, te
                IN 1..1
                ANY rv._id
                GRAPH 'games'
                FILTER te.type == 'round2tee'
                RETURN MERGE(tv, {
                    assigned: te.assigned
                })
              )
              RETURN MERGE(rv, {
                handicap_index: re.handicap_index,
                game_handicap: re.game_handicap,
                course_handicap: re.course_handicap,
                tee: FIRST(tee)
              })
          )
          LET players = (
            FOR pv, pe
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER pe.type == 'player2game'
              RETURN pv
          )
          SORT g.start DESC
          RETURN MERGE(g, {players, rounds})
        `;
        cursor = await db.query(query);
        break;
      case 'myclubs':
        query = `
        FOR g IN games
          FILTER g.start > '${begDate}' AND g.start < '${endDate}'
          LET rounds = (
            FOR rv, re
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER re.type == 'round2game' AND rv != null
              LET tee = (
                FOR tv, te
                IN 1..1
                ANY rv._id
                GRAPH 'games'
                FILTER te.type == 'round2tee'
                RETURN MERGE(tv, {
                  assigned: te.assigned
                })
              )
              RETURN MERGE(rv, {
                handicap_index: re.handicap_index,
                game_handicap: re.game_handicap,
                course_handicap: re.course_handicap,
                tee: FIRST(tee)
              })
          )
          LET players = (
            FOR pv, pe
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER pe.type == 'player2game'
              LET myclubs = (
                FOR cv, ce
                  IN 1..1
                  ANY pv._id
                  GRAPH 'games'
                  FILTER ce.type == 'player2club'
                    AND CONTAINS(@myClubs, ce._to)
                  RETURN true
              )
              RETURN {player: pv, fltr: POSITION(myclubs, true)}
          )
          FILTER POSITION( players[*].fltr, true )
          SORT g.start DESC
          RETURN MERGE(g, {players: players[*].player, rounds})
        `;
        cursor = await db.query(query, {myClubs});
        break;
      case 'faves':
        query = `
        FOR g IN games
        FILTER g.start > '${begDate}' AND g.start < '${endDate}'
          LET rounds = (
            FOR rv, re
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER re.type == 'round2game' AND rv != null
              LET tee = (
                FOR tv, te
                IN 1..1
                ANY rv._id
                GRAPH 'games'
                FILTER te.type == 'round2tee'
                RETURN MERGE(tv, {
                  assigned: te.assigned
                })
              )
              RETURN MERGE(rv, {
                handicap_index: re.handicap_index,
                game_handicap: re.game_handicap,
                course_handicap: re.course_handicap,
                tee: FIRST(tee)
              })
          )
          LET players = (
            FOR pv, pe
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER pe.type == 'player2game'
              LET fave = (
                FOR fv, fe
                  IN 1..1
                  ANY pv._id
                  GRAPH 'games'
                  FILTER fe.type == 'player2player'
                    AND fe.favorite == "true"
                    AND fe._from == '${currentPlayer}'
                    AND fe._to == pv._id
                  RETURN fv._id
              )
              RETURN {player: pv, fltr: CONTAINS(fave, '${currentPlayer}')}
          )
          FILTER POSITION( players[*].fltr, true )
          SORT g.start DESC
          RETURN MERGE(g, {players: players[*].player, rounds})
        `;
        cursor = await db.query(query);
        break;
      case 'me':
        query = `
        FOR g IN games
          FILTER g.start > '${begDate}' AND g.start < '${endDate}'
          LET rounds = (
            FOR rv, re
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER re.type == 'round2game' AND rv != null
              LET tee = (
                FOR tv, te
                IN 1..1
                ANY rv._id
                GRAPH 'games'
                FILTER te.type == 'round2tee'
                RETURN MERGE(tv, {
                  assigned: te.assigned
                })
              )
              RETURN MERGE(rv, {
                handicap_index: re.handicap_index,
                game_handicap: re.game_handicap,
                course_handicap: re.course_handicap,
                tee: FIRST(tee)
              })
          )
          LET players = (
            FOR pv, pe
              IN 1..1
              ANY g._id
              GRAPH 'games'
              FILTER pe.type == 'player2game'
              LET fltr = ( pv._id == '${currentPlayer}' )
              RETURN {player: pv, fltr}
          )
          FILTER POSITION( players[*].fltr, true )
          SORT g.start DESC
          RETURN MERGE(g, {players: players[*].player, rounds})
        `;
        cursor = await db.query(query);
        break;
    }
    //console.log('query', query);
    return await cursor.all();
  }

};

const _Game = Game;
export { _Game as Game };
