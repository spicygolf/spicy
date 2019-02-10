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

import { GetTeeForGame } from 'features/courses/graphql';

import { blue } from 'common/colors';

import { navigate } from 'common/components/navigationService';



class Courses extends React.Component {

  constructor(props) {
    super(props);
    this._itemPressed = this._itemPressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _itemPressed(tee) {
    navigate('course_tee_item', {tee: tee});
  }

  _renderItem({item}) {
    if( item && item.name && item.course && item.course.name ) {
      return (
        <ListItem
          title={item.course.name || ''}
          subtitle={item.name || 'no Tee selected'}
          rightIcon={{name: 'remove-circle', color: 'red'}}
          onPress={() => this._itemPressed(item)}
          onPressRightIcon={() => null} //removeTee(this.props.gkey)
        />
      );
    } else {
      return null;
    }
  }

  render() {

    const { gkey, showButton } = this.props;

    const addButton = ( showButton ) ?
      (
        <Icon
          name='add-circle'
          color={blue}
          size={40}
          title='Add Course,Tees'
          onPress={() => navigate('add_course')}
          testID='add_course_button'
        />
      ) : (<Icon name='add-circle' size={40} color='#fff'/>);

    let t;
    if( gkey ) {
      t = (
        <GetTeeForGame
          gkey={gkey}
        >
          {({ loading, tee }) => {
            if( loading ) return null;
            return this._renderItem({item: tee});
          }}
        </GetTeeForGame>
      );
    } else {
      t = (<Text>Error</Text>); // TODO: error component
      console.log('error, game not set in courses from gameSetup');
    }

    return (
      <Card>
        <View style={styles.cardTitle}>
          <Icon name='add-circle' size={40} color='#fff'/>
          <Text style={styles.title}>Course/Tee</Text>
          { addButton }
        </View>
        <List containerStyle={styles.listContainer}>
        {t}
        </List>
      </Card>
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
