import { courseSearch, crawlClub, getActiveClubs, login, search } from '../../src/util/ghin';

import { Course } from '../../src/models/course';
import { Player } from '../../src/models/player';
import arg from 'arg';
import { createInterface } from 'readline';

const clubs = async () => {

  const clubList = await getActiveClubs();
  const loggingOn = true;

  clubList.map(async club => {
    await crawlClub(club, loggingOn);
  });

};


const addPlayerNumName = async numName => {

  const [ghinNumber, lastName] = numName.split(':');

  console.log(`Player Num/Name: ${ghinNumber} ${lastName}`);
  const { golfers, token } = await login(ghinNumber, lastName);
  const g = golfers[0];
  const player = {
    name: `${g.FirstName.trim()} ${g.LastName.trim()}`,
    short: g.FirstName.trim(),
    lastName: g.LastName.trim(),
    ghinNumber: g.GHINNumber,
    handicap: {
      source: 'ghin',
      id: g.GHINNumber,
      firstName: g.FirstName.trim(),
      lastName: g.LastName.trim(),
      playerName: `${g.FirstName.trim()} ${g.LastName.trim()}`,
      gender: g.Gender,
      active: g.Active == 'true',
      index: g.Display,
      revDate: g.RevDate,
    },
    ghinData: golfers,
  };

  console.log('registering ', player);
  const p = new Player();
  const register = await p.register(player);
  console.log('player register successful: ', register);

};


const player = async name => {

  rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const [state, lastName] = name.split(':');
  let page = 1;
  const perPage = 25;

  console.log(`Player Search: ${name}`);
  const { token } = await login();

  await getPlayerToCrawl({state, lastName, page, perPage, token});

};


const getPlayerToCrawl = async (args) => {

  const resp = await search(args);
  //const resp = {golfers: ['boorad']};

  resp.golfers.map((g, i) => {
    console.log(`${i+1}: ${g.first_name} ${g.last_name} - ${g.handicap_index} - ${g.club_name}`);
  });
  return await rl.question(`Choose Player Number or 'b' (back) 'f' (forward): `, async input => {
    if( input == 'f' ) {
      const newPage = args.page + 1;
      console.log('page', newPage);
      return getPlayerToCrawl({...args, page: newPage});
    }
    if( input == 'b' ) {
      let newPage = args.page - 1;
      if( newPage < 1 ) newPage = 1;
      console.log('page', newPage);
      return getPlayerToCrawl({...args, page: newPage});
    }

    rl.close();
    const g = resp.golfers[parseInt(input)-1] || null;
    if( g ) {
      //console.log('g', g);
      const player = {
        name: `${g.first_name.trim()} ${g.last_name.trim()}`,
        short: g.first_name.trim(),
        lastName: g.last_name.trim(),
        ghinNumber: g.ghin,
        handicap: {
          source: 'ghin',
          id: g.ghin,
          firstName: g.first_name.trim(),
          lastName: g.last_name.trim(),
          playerName: `${g.first_name.trim()} ${g.last_name.trim()}`,
          gender: g.gender,
          active: g.status == 'Active',
          index: g.handicap_index,
          revDate: g.rev_date,
        },
        ghinData: [{
          GHINNumber: g.ghin,
          Active: (g.status == 'Active') ? 'true' : 'false',
          ClubId: g.club_id,
          ClubName: g.club_name,
          Assoc: g.association_id,
          Club: g.club_id, // this is wrong
          PrimaryClubState: g.state,
          PrimaryClubCountry: g.country,
        }],
      }
      console.log('registering ', player);
      const p = new Player();
      const register = await p.register(player);
      console.log('player register successful: ', register);

    } else {
      console.error(`Didn't choose a number with a golfer.`);
    }
  });
};


const course = async name => {

  rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`Course Search: ${name}`);
  const { token } = await login();

  await getCourseToCrawl({name, token});

};


const getCourseToCrawl = async (args) => {

  const resp = await courseSearch(args);

  resp.courses.map((c, i) => {
    console.log(`${i+1}: ${c.State} - ${c.FacilityName} - ${c.CourseName} - ${c.FullName}`);
  });
  return await rl.question(`Choose Course Number: `, async input => {
    rl.close();
    const course = resp.courses[parseInt(input)-1] || null;
    if( course ) {
      console.log('registering ', course);
      const c = new Course();
      const register = await c.register(null, course);
      console.log('course register successful', register);
    } else {
      console.error(`Didn't choose a number with a course.`);
    }
  });
};



const args = arg({
  '--clubs': Boolean,
  '--course': String,
  '--add-player': String,
  '--add-player-num-name': String,
});


const main = () => {
  //console.log('args', args);
  // TODO: change to --crawl-clubs
  if( args['--clubs'] ) clubs();
  // TODO: change to --add-course
  if( args['--course'] ) course(args['--course']);
  // TODO: change to --add-player
  if( args['--add-player'] ) player(args['--add-player']);
  if( args['--add-player-num-name'] ) addPlayerNumName(args['--add-player-num-name']);
};


main();
