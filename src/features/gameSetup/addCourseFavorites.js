import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View
} from 'react-native';

import {
  GET_FAVORITE_TEES_FOR_PLAYER_QUERY,
  GetFavoriteTeesForPlayer
} from 'features/courses/graphql';

import Tee from 'features/gameSetup/Tee';
import { GameContext } from 'features/game/gamecontext';



class AddCourseFavorites extends React.Component {

  static contextType = GameContext;

  constructor(props) {
    super(props);
    //console.log('addCourseFavorite props', props);
    this._renderFavoritesTee = this._renderFavoritesTee.bind(this);
  }

  _renderFavoritesTee({item}) {
    const { game } = this.context;
    const { _key:gkey } = game;
    const tee = this.props.navigation.getParam('tee');
    const rkey = this.props.navigation.getParam('rkey');
    console.log('addCourseFavorites gkey', gkey, 'tee', tee, 'rkey', rkey);
    return (
      <Tee
        gkey={gkey}
        rkey={rkey}
        oldTee={tee}
        item={item}
        title={item.course.name}
        subtitle={`${item.name} - ${item.rating.all18}/${item.slope.all18}`}
        rounds={[]}
      />
    );
  }

  render() {

    const { currentPlayerKey } = this.context;

    return (
      <View style={styles.container}>
        <GetFavoriteTeesForPlayer pkey={currentPlayerKey}>
          {({loading, tees}) => {
            if( loading ) return (<ActivityIndicator />);
            //console.log('fave tees', tees, pkey);
            const newTees = tees.map(tee => ({
              ...tee,
              fave: {
                faved: true,
                from: {type: 'player', value: currentPlayerKey},
                to:   {type: 'tee', value: tee._key},
                refetchQueries: [{
                  query: GET_FAVORITE_TEES_FOR_PLAYER_QUERY,
                  variables: {
                    pkey: currentPlayerKey
                  }
                }]
              }
            }));
            return (
              <View style={styles.listContainer}>
                <FlatList
                  data={newTees}
                  renderItem={this._renderFavoritesTee}
                  keyExtractor={item => item._key}
                  keyboardShouldPersistTaps={'handled'}
                />
              </View>
            );
          }}
        </GetFavoriteTeesForPlayer>
      </View>
    );
  }

}

export default AddCourseFavorites;


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 50
  }
});
