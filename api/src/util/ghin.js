import { Edge } from '../models/edge';
import { Player } from '../models/player';
import { aql } from 'arangojs';
import axios from 'axios';
import datefnstz from 'date-fns-tz';
import { db } from '../db/db';
import fetch from "node-fetch";
import { find } from 'lodash-es';
import { format } from 'date-fns';
import mocked from '../../data/hbh_postScore_response.json' assert {type: 'json'};
import { titleize } from './text';

// TODO: switch all over to axios
const { get } = axios;
const { utcToZonedTime } = datefnstz;

const base_url = 'https://api2.ghin.com/api/v1';



const login = async (ghinNumber, lastName) => {
  let ret = { token: null };
  const gn = ghinNumber ? ghinNumber : '1152839';
  const ln = lastName ? lastName : 'Anderson';

  const { expiresIn, token } = await generateAuthTokens();

  const body = {
    source: 'GHINcom',
    token,
    user: {
      email_or_ghin: gn,
      password: 'sof!whut_JUW1ceef',
      remember_me: false,
    },
  };
  const url = `${base_url}/golfer_login.json`;
  const res = await post_request(url, body, 'golfers', null);
  // console.log('      auth token', token);
  // console.log('ghin login token', res?.golfer_user?.golfer_user_token);
  return {
    token: res?.golfer_user?.golfer_user_token,
    golfers: res?.golfer_user?.golfers,
  };
};

const generateAuthTokens = async () => {
  const url = `https://firebaseinstallations.googleapis.com/v1/projects/ghin-mobile-app/installations/ebIg7_MpeE3eniyYXlLy6C/authTokens:generate`;
  const body = {installation: { sdkVersion: 'w:0.5.4'}};
  let headers = getHeaders();
  headers['Authorization'] = 'FIS_v2 2_x40h0MgGeR0FUh_61TJV_PUXWCMAtLeZoU3eyUscNLxWstaBzYq0qTbgedghSn6a';
  headers['x-goog-api-key'] = 'AIzaSyBxgTOAWxiud0HuaE5tN-5NTlzFnrtyz-I';

  const fetch_res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: headers,
  });

  const res = await fetch_res.json();

  // console.log('generateAuthTokens', res);
  return res;
};

// player search
const search = async ({state, lastName, firstName, page, perPage, token}) => {
  let vars = {
    status: 'Active',
    from_ghin: true,
    sortingCriteria: 'full_name',
    order: 'asc',
    per_page: perPage,
    page: page,
    state: state,
    last_name: lastName,
    first_name: firstName,
    source: 'GHINcom',
  };
  //console.log('search vars', vars);
  const qs = build_qs(vars);
  const url = `${base_url}/golfers.json?${qs}`;
  const res = await get_request(url, 'golfers', token, null);
  if( res && res.golfers ) return res;
  return { golfers: [] };
};

const courseSearch = async ({name, token}) => {
  const params = {
    name: name,
  };
  const url = `${base_url}/crsCourseMethods.asmx/SearchCourses.json`;
  const res = await get(url, {
    params: params,
    headers: getHeaders(token),
  });
  if( res && res.data && res.data.courses ) return res.data;
  return { courses: [] };
};

const getActiveClubs = async () => {

  const query = aql`
    FOR c IN clubs
      FILTER c.club_id != null
      RETURN c
  `;

  const cursor = await db.query(query);
  return await cursor.all();
};

const getClubFacilities = async (club_id, token) => {
  const url = `${base_url}/clubs/${club_id}/facility_home_courses.json`;
  const facilities = await get_request(url, 'facilities', token);
  return facilities;
};

const getTokenForClub = async club => {
  if( !club || !club._id ) {
    console.log('no club supplied to getTokenForClub');
    return null;
  }

  const query = aql`
    FOR v, e
      IN 1..1
      ANY ${club._id}
      GRAPH 'games'
      FILTER e.type == 'player2club'
      RETURN v
  `;

  const cursor = await db.query(query);
  const players = await cursor.all();

  // pick a random player to use for login
  const p = players[Math.floor(Math.random() * players.length)];
  const { token } = await login(p.handicap.id, p.handicap.lastName);
  return token;
};

const crawlClub = async (club, log) => {

  const token = await getTokenForClub(club);

  let fetched = 0;
  let total = 0;
  let page = 1;
  const perPage = 100;

  if( log ) {
    console.log("\n");
    console.log(club.name);
  }

  do {
    try {

      // fetch golfers from GHIN
      const { golfers, meta } = await getClubGolfers(
        club.club_id,
        token,
        page,
        perPage
      );

      // write golfers to db
      golfers.map(async g => {
        const playerName = titleize(`${g.first_name} ${g.last_name}`);
        const handicap = {
          source: 'ghin',
          id: g.id.toString(),
          firstName: g.first_name,
          lastName: g.last_name,
          playerName: playerName,
          gender: g.gender,
          active: g.status == 'Active',
          index: g.handicap_index,
          revDate: g.rev_date,
        };
        const p = new Player();
        const ret = await p.upsert_ghin(handicap, handicap.id);
        if( ret && ret._id ) {
          await refreshEdge('player2club', ret._id, club._id);
        }
        if( log ) console.log(` ${playerName} - ${g.handicap_index}`);
      });

      // set some variables for the next iteration
      page++;
      fetched += golfers.length;
      total = meta.active_golfers_count;

    } catch(e) {
      console.error(e);
      break;
    }

  } while ( fetched < total );

};

const getClubGolfers = async (club_id, token, page, perPage) => {
  const qs = build_qs({
    page: page,
    perPage: perPage,
    status: "Active",
  });
  const url = `${base_url}/clubs/${club_id}/golfers.json?${qs}`;
  const golfers = await get_request(url, 'golfers', token);
  return golfers;
};

const getCourse = async (course_id, token) => {
  const url = `${base_url}/courses/${course_id}.json`;
  const course = await get_request(url, null, token);
  return course;
};

const refreshEdge = async (type, f, t, data = {}) => {
  let newEdge = {
    type: type,
    _from: f,
    _to: t,
    ...data,
  };
  const edge = new Edge(type);
  const existing = await edge.find({type: type, _from: f, _to: t});
  if( existing && existing.length ) {
    newEdge._key = existing[0]._key;
  }
  edge.set(newEdge);
  await edge.save({overwrite: true});
};

const postRound = async ({player, round, course, tee, token}) => {

  // TODO: get timezone for the game, and not rely on the server's timezone?
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const played_at = format(utcToZonedTime(new Date(round.date), timeZone), 'yyyy-MM-dd');
  //console.log('postRound', timeZone, played_at);

  const hole_details = round.scores.map(hole => {
    const hole_number = parseInt(hole.hole);
    const gross_value = find(hole.values, {k: 'gross'});
    const raw_score = parseInt(gross_value.v);
    const ret = {hole_number, raw_score};
    //console.log('hole_details', ret);
    return ret;
  })

  const body = {
    golfer_id: player.handicap.id,
    gender:player.handicap.gender,
    course_id: course.course_id,
    tee_set_id: tee.tee_id,
    tee_set_side: "All18",
    played_at,
    score_type: "H",
    number_of_holes: 18,
    override_confirmation: false,
    is_manual: false,
    hole_details,
  };

  const url = `${base_url}/scores/hbh.json`;
  let res;
  const REALLY_POST_TO_GHIN = true;
  if( REALLY_POST_TO_GHIN ) {
    res = await post_request(url, body, null, token);
  } else {
    console.log('Not really posting score to GHIN service.');
    res = mocked;
  }
  //console.log('postRound res', res);
  return res;

};


const getPlayers = async ({qs, token}) => {
  const qstr = build_qs(qs)
  const url = `${base_url}/golfers.json?${qstr}`;
  const ret = await get_request(url, 'golfers', token);
  // console.log('getPlayers ret', ret);
  return ret;
};

const getPlayersScores = async ({ghin, token}) => {
  const url = `${base_url}/golfers/${ghin}/scores.json`;
  const ret = await get_request(url, 'revision_scores', token);
  // console.log('getPlayerScores ret', ret);
  return ret;
};



//
// helper functions
//
const getHeaders = token => {
  let headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Authority': 'api2.ghin.com',
  };
  if( token ) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const get_request = async (url, test_key, token) => {

  let ret;

  const headers = getHeaders(token);

  try {
    const fetch_res = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    ret = await fetch_res.json();

    if( ret && test_key && ret[test_key] && !ret[test_key].length ) {
      return null;
    }

  } catch(e) {
    console.error(e);
  } finally {
    return ret;
  }

};

const post_request = async (url, body, test_key, token) => {

  let ret;

  const headers = getHeaders(token);
  headers['Content-Type'] = 'application/json';

  try {
    const fetch_res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: headers,
    });

    ret = await fetch_res.json();

    if( ret && test_key && ret[test_key] && !ret[test_key].length ) {
      return null;
    }

  } catch(e) {
    console.error(e);
  } finally {
    return ret;
  }

};

const build_qs = args => {
  const a = [];
  for( let key in args ) {
    if( args.hasOwnProperty(key) ) {
      a.push(`${key}=${args[key]}`);
    }
  }
  return a.join('&');
};

export {
  login,
  search,
  getActiveClubs,
  getClubFacilities,
  crawlClub,
  getClubGolfers,
  courseSearch,
  getCourse,
  getPlayers,
  getPlayersScores,
  refreshEdge,
  postRound,
};
