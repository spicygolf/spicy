import { useMutation } from '@apollo/client';
import { green } from 'common/colors';
import React from 'react';
import { Icon } from 'react-native-elements';

import { ADD_LINK_MUTATION } from '../graphql/link';
import { REMOVE_LINK_MUTATION } from '../graphql/unlink';

const FavoriteIcon = (props) => {
  const { fave } = props;
  const [addLink] = useMutation(ADD_LINK_MUTATION);
  const [removeLink] = useMutation(REMOVE_LINK_MUTATION);

  const iconData = {
    name: fave?.faved ? 'star' : 'star-border',
    fn: fave?.faved ? removeLink : addLink,
    variables: fave?.faved
      ? { from: fave?.from, to: fave?.to }
      : {
          from: fave?.from,
          to: fave?.to,
          other: [{ key: 'favorite', value: 'true' }],
        },
  };

  return (
    <Icon
      name={iconData.name}
      color={green}
      size={36}
      onPress={async () => {
        const { errors } = await iconData.fn({
          variables: iconData.variables,
          refetchQueries: fave.refetchQueries,
        });
        if (errors) {
          console.log(`favoriteIcon error performing '${iconData.fn.name}'`, errors);
        }
      }}
    />
  );
};

export default FavoriteIcon;
