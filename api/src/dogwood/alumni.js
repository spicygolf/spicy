import HashMap from 'hashmap';
import Tabletop from 'tabletop';
import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';

const dogwood_url = `https://docs.google.com/spreadsheets/d/19AEJ834ssE7jdc9AOh8z8-_bkqfx1GC28k_gghZPP5o/edit?usp=sharing`;
const owgr_pga_url = `https://www.pgatour.com/stats/stat.186.html`;

const get_owgr = async () => {
  const response = await axios.get(owgr_pga_url);
  const html = response.data;
  const $ = cheerio.load(html);
  const rows = $('table#statsTable tbody tr')
  const players = [];
  rows.each((i, e) => {
    const r = $('td:nth-child(1)', e);
    const rank = parseInt(r.text().trim());
    let player = { rank, };
    const td = $('td.player-name', e);
    const a = $('a', td);
    player.name = a.text() ? a.text().trim() : td.text().trim();
    player.uri = a.attr('href');
    player.slug = slugify(player.name);
    players.push(player);
  });
  return players;
};

const get_dogwood = async () => {
  let players = new HashMap();

  const data = await Tabletop.init({
    key: dogwood_url,
    simpleSheet: true,
  });

  data.map(p => {
    const slug = slugify(`${p['First Name'].trim()} ${p['Last Name'].trim()}`);
    // try to get player (that may be there but not a champ)
    const existing = players.get(slug);
    if(
      ( existing && ('Champion' in existing) && existing.Champion != 'y' & p.Champion == 'y' ) ||
      ( !existing )
    ) {
      players.set(slug, p);
    }
  });

  return players;
};

const slugify = name => {
  let ret;
  ret = name.replace(/\./g, '');
  ret = ret.replace(/\'/g, '');
  ret = ret.toLowerCase();
  return ret;
};

const main = async () => {
  let owgr_players = await get_owgr();
  //console.log(JSON.stringify(owgr_players, null, 2));
  let dogwood_players = await get_dogwood();
  // console.log(JSON.stringify(dogwood_players, null, 2));
  let alumni = [];
  owgr_players.map(p => {
    const existing = dogwood_players.get(p.slug);
    if( existing ) {
      alumni.push({
        ...p,
        dogwood: true,
        dogwood_champ: (existing.Champion == 'y'),
      });
    }
  });
  const ret = {
    date: (new Date()).toISOString(),
    players: alumni,
  }
  // console.log('ret', JSON.stringify(ret, null, 2));
  // console.log('total', alumni.length);
  fs.writeFileSync('./src/dogwood/alumni.json', JSON.stringify(ret, null, 2), 'utf-8');
};

main();
