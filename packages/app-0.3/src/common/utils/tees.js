import { query } from 'features/courses/useGetFavoriteTeesForPlayerQuery';
import { find } from 'lodash-es';

export const addFavesToTee = ({ tee, faves, game, currentPlayerKey }) => {
  return {
    ...tee,
    fave: {
      faved: find(faves, { _key: tee.tee_id }) ? true : false,
      from: { type: 'player', value: currentPlayerKey },
      to: { type: 'tee', value: tee.tee_id },
      refetchQueries: [
        {
          query,
          variables: {
            pkey: currentPlayerKey,
            gametime: game.start,
          },
        },
      ],
    },
  };
};
