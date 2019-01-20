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
  ListItem
} from 'react-native-elements';

import { Query } from 'react-apollo';

import {
  SEARCH_COURSE_QUERY
} from 'features/courses/graphql';



const ListHeader = ({title}) => (
  <View>
    <Text style={styles.header}>{title}</Text>
  </View>
);


class SearchCourses extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      q: ''
    };
    this._coursePressed = this._coursePressed.bind(this);
    this._renderCourse = this._renderCourse.bind(this);
  }

  _coursePressed(course) {
    Keyboard.dismiss();

    // now choose tees


//    this.props.addFn(course._key);
//    this.props.navigation.goBack();
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

  render() {
    const { q } = this.state;

    return (
      <View style={styles.container}>
        <TextInput
          style={styles.searchTextInput}
          placeholder='search courses...'
          autoCapitalize='none'
          autoFocus={true}
          onChangeText={text => this.setState({q: text})}
          value={q}
        />
        <View style={styles.searchResultsContainer}>
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
  }
}


export default SearchCourses;


const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 20,
    fontWeight: 'bold'
  },
  container: {

  },
  searchTextInput: {
    fontSize: 20,
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20
  },
  searchResultsContainer: {

  },
});
