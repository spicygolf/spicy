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

import { Query } from 'react-apollo';

import {
  SEARCH_PLAYER_QUERY
} from 'features/players/graphql';

import Player from 'features/gameSetup/Player';



const ListHeader = ({title}) => (
  <View>
    <Text style={styles.header}>{title}</Text>
  </View>
);



class AddPlayerSearch extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      q: ''
    };
    this.searchInput = null;
    this._renderPlayer = this._renderPlayer.bind(this);
  }

  _renderPlayer({item}) {
    const handicap = (item && item.handicap && item.handicap.display) ?
    item.handicap.display : 'no handicap';
    const club = (item && item.clubs && item.clubs[0]) ?
    ` - ${item.clubs[0].name}` : '';

    return (
      <Player
        gkey={this.props.screenProps.gkey}
        item={item}
        title={item.name}
        subtitle={`${handicap} - ${club}`}
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
    const { q } = this.state;

    return (
      <View style={styles.container}>
        <TextInput
          ref={(input) => { this.searchInput = input; }}
          style={styles.searchTextInput}
          placeholder='search players...'
          autoCapitalize='none'
          onChangeText={text => this.setState({q: text})}
          value={q}
        />
        <View>
          <Query
            query={SEARCH_PLAYER_QUERY}
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
                  data.searchPlayer &&
                  data.searchPlayer.length) ?
                (<ListHeader title='Registered Players' />) : null;

              return (
                <FlatList
                  data={data.searchPlayer}
                  renderItem={this._renderPlayer}
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


export default AddPlayerSearch;


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
