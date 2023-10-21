import { useFireproof } from "use-fireproof";
import { getUTCNowISO } from "./utils/datetime";
import { useState } from "react";

const Games = () => {

  const {database, useLiveQuery } = useFireproof('spicy');
  const games = useLiveQuery('start').docs;
  const [game, setGame] = useState({});

  return (
    <>
      <ul>
        <li
          key="1"
          onClick={() => setGame({name: 'Five Points', gamespec: 1})}
        >
          Five Points
        </li>
        <li
          key="2"
          onClick={() => setGame({name: 'Match Play', gamespec: 2})}
        >
          Match Play
        </li>
      </ul>
      <textarea
        rows={4}
        cols={50}
        value={JSON.stringify(game, null, 2)}
      /><br />
      <button onClick={() => database.put({...game, start: getUTCNowISO() })}>
        Create Game
      </button>
      <ul>
        {games.map(game=> (
          <li key={game._id}>
            {game.name as string}<br />
            {game.start as string}<br />
            {game.gamespec as string}<br />
            <span onClick={() => database.del(game._id || '')}>
              delete
            </span>
          </li>
        ))}
      </ul>
    </>
  );

};

export default Games;
