'use strict';

import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import {
  Card,
  ListItem
} from 'react-native-elements';

import { Query } from 'react-apollo';

import { find, orderBy } from 'lodash';

import {
  SEARCH_COURSE_QUERY
} from 'features/courses/graphql';

import {
  getCurrentPlayerKey,
  renderCourseTee
} from 'features/gameSetup/gameSetupFns';
import {
  GET_FAVORITE_TEES_FOR_PLAYER_QUERY,
  GetFavoriteTeesForPlayer
} from 'features/courses/graphql';


const ListHeader = ({title}) => (
  <View>
    <Text style={styles.header}>{title}</Text>
  </View>
);


class AddCourseSearch extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      q: '',
      course: null
    };
    this._coursePressed = this._coursePressed.bind(this);
    this._removeCourse = this._removeCourse.bind(this);
    this._renderCourse = this._renderCourse.bind(this);
    this.searchInput = null;
  }

  _coursePressed(course) {
    Keyboard.dismiss();
    this.setState({course: course});
  }

  _removeCourse() {
    this.setState({
      course: null
    });
  }

  _renderCourse({item}) {
    return (
      <ListItem
        title={item.name || ''}
        subtitle={`${item.city}, ${item.state}`}
        onPress={() => this._coursePressed(item)}
      />
    );
  }

  componentDidMount() {
    this.didFocusListener = this.props.navigation.addListener('didFocus', () => {
      if( this.searchInput ) {
        this.searchInput.focus();
      }
    });
  }

  componentWillUnmount() {
    this.didFocusListener.remove();
  }

  render() {
    const { q, course } = this.state;

    if( !course ) {
      return (
        <View style={styles.container}>
          <TextInput
            ref={(input) => { this.searchInput = input; }}
            style={styles.searchTextInput}
            placeholder='search courses...'
            autoCapitalize='none'
            onChangeText={text => this.setState({q: text})}
            value={q}
          />
          <View>
            <Query
              query={SEARCH_COURSE_QUERY}
              variables={{q: q}}
            >
              {({ loading, error, data }) => {
                if( loading ) return (<ActivityIndicator />);
                if( error ) {
                  console.log(error);
                  return (<Text>Error</Text>);
                }

                const header = (
                    data &&
                    data.searchCourse &&
                    data.searchCourse.length) ?
                  (<ListHeader title='Courses' />) : null;

                return (
                  <FlatList
                    data={data.searchCourse}
                    renderItem={this._renderCourse}
                    ListHeaderComponent={header}
                    keyExtractor={item => item._key}
                    keyboardShouldPersistTaps={'handled'}
                  />
                );
              }}
            </Query>
          </View>
        </View>
      );
    } else {
      const pkey = getCurrentPlayerKey();

      return (
        <GetFavoriteTeesForPlayer pkey={pkey}>
          {({loading, tees:faveTees}) => {
            if( loading ) return (<ActivityIndicator />);
            let tees = course.tees.map(tee => ({
              ...tee,
              slope: tee.slope.all18 ? tee.slope.all18 : tee.slope.front9,
              rating: tee.rating.all18 ? tee.rating.all18 : tee.rating.front9,
              fave: {
                faved: (find(faveTees, {_key: tee._key}) ? true : false),
                from: {type: 'player', value: pkey},
                to:   {type: 'tee', value: tee._key},
                refetchQueries: [{
                  query: GET_FAVORITE_TEES_FOR_PLAYER_QUERY,
                  variables: {
                    pkey: pkey
                  }
                }]
              }
            }));
            tees = orderBy(tees,
                           ['gender', 'rating', 'slope'],
                           ['desc',   'desc',   'desc' ]);

            const cardHeader = (
              <ListItem
                title={course.name}
                subtitle={`${course.city}, ${course.state}`}
                rightIcon={{name: 'remove-circle', color: 'red'}}
                onPressRightIcon={() => this._removeCourse()}
              />
            );

            const cardList = (
              <View style={styles.listContainer}>
                <FlatList
                  data={tees}
                  renderItem={renderCourseTee}
                  keyExtractor={item => item._key}
                  keyboardShouldPersistTaps={'handled'}
                />
              </View>
            );

            return (
              <Card>
                { cardHeader }
                { cardList }
              </Card>
            );

          }}
        </GetFavoriteTeesForPlayer>
      );
    }
  }
}


export default AddCourseSearch;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15
  },
  header: {
    paddingTop: 10,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 20,
    fontWeight: 'bold'
  },
  searchTextInput: {
    fontSize: 20,
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20
  },
  cardTitle: {
    flexDirection: 'row',
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555'
  },
  citystate: {
    fontSize: 12,
    color: '#555'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 50
  }
});
