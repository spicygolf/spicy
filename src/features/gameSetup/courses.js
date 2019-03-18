'use strict';

import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  Card,
  Icon,
  List,
  ListItem
} from 'react-native-elements';

import { find, remove } from 'lodash';

import {
  GetTeeForGame,
  GET_TEE_FOR_GAME_QUERY
} from 'features/courses/graphql';

import { blue } from 'common/colors';

import { navigate } from 'common/components/navigationService';
import { RemoveLinkMutation } from 'common/graphql/unlink';



class Courses extends React.Component {

  constructor(props) {
    super(props);
    this._itemPressed = this._itemPressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _itemPressed(tee) {
    navigate('course_tee_item', {tee: tee});
  }

  _renderItem(tee) {
    if( tee && tee.name && tee.course && tee.course.name ) {
      const { gkey } = this.props;
      return (
        <RemoveLinkMutation>
          {({removeLinkMutation}) => (
            <ListItem
              title={tee.course.name || ''}
              subtitle={tee.name || 'no Tee selected'}
              rightIcon={{name: 'remove-circle', color: 'red'}}
              onPress={() => this._itemPressed(tee)}
              onPressRightIcon={async () => {
                const {data, errors} = await removeLinkMutation({
                  variables: {
                    from: {type: 'game', value: gkey},
                    to: {type: 'tee', value: tee._key}
                  },
                  update: (cache, result) => {
                    cache.writeQuery({
                      query: GET_TEE_FOR_GAME_QUERY,
                      variables: {gkey: gkey},
                      data: {GetTeeForGame: {}}
                    });
                  },
                  ignoreResults: true
                });
                if( errors ) {
                  console.log('error removing tee from game', errors);
                }
              }}
            />
          )}
        </RemoveLinkMutation>
      );
    } else {
      return null;
    }
  }

  render() {

    const { gkey } = this.props;

    const addButton = (
      <Icon
        name='add-circle'
        color={blue}
        size={40}
        title='Add Course,Tees'
        onPress={() => navigate('add_course')}
        testID='add_course_button'
      />
    );
    const noAddButton = (<Icon name='add-circle' size={40} color='#fff'/>);

    return (
      <GetTeeForGame gkey={gkey}>
        {({ loading, tee }) => {
          let showButton = true;
          if( loading ) return (<ActivityIndicator />);
          if( tee && tee._key ) showButton = false;
          return (
            <Card>
              <View style={styles.cardTitle}>
                { noAddButton }
                <Text style={styles.title}>Course/Tee</Text>
                { showButton ? addButton : noAddButton }
              </View>
              <List containerStyle={styles.listContainer}>
                { this._renderItem(tee) }
              </List>
            </Card>
          );
        }}
      </GetTeeForGame>
    );
  }

}

export default Courses;


const styles = StyleSheet.create({
  cardTitle: {
    flexDirection: 'row',
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  },
});
