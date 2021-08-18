import { green } from 'common/colors';
import { AddLinkMutation } from 'common/graphql/link';
import { RemoveLinkMutation } from 'common/graphql/unlink';
import React from 'react';
import { Icon } from 'react-native-elements';

class FavoriteIcon extends React.Component {
  constructor(props) {
    super(props);
    //    if( this.props && this.props.fave && this.props.fave.faved ) {
    //      this.state = {
    //        faved: this.props.fave.faved
    //      }
    //    }
  }

  render() {
    let content;

    if (this.props.fave && this.props.fave.faved) {
      content = (
        <RemoveLinkMutation>
          {({ removeLinkMutation }) => {
            return (
              <Icon
                name="star"
                color={green}
                size={36}
                onPress={async () => {
                  const { data, errors } = await removeLinkMutation({
                    variables: {
                      from: this.props.fave.from,
                      to: this.props.fave.to,
                    },
                    refetchQueries: this.props.fave.refetchQueries,
                    update: (cache, result) => {
                      if (this.props.fave.update) {
                        cache.writeQuery(this.props.fave.update);
                      }
                    },
                  });
                  if (errors) {
                    console.log('error removing favorite', errors);
                  }
                }}
              />
            );
          }}
        </RemoveLinkMutation>
      );
    } else {
      content = (
        <AddLinkMutation>
          {({ addLinkMutation }) => {
            return (
              <Icon
                name="star-border"
                color={green}
                size={36}
                onPress={async () => {
                  const { data, errors } = await addLinkMutation({
                    variables: {
                      from: this.props.fave.from,
                      to: this.props.fave.to,
                      other: [{ key: 'favorite', value: 'true' }],
                    },
                    refetchQueries: this.props.fave.refetchQueries,
                  });
                  if (errors) {
                    console.log('error adding favorite', errors);
                  }
                }}
              />
            );
          }}
        </AddLinkMutation>
      );
    }

    return content;
  }
}

export default FavoriteIcon;
