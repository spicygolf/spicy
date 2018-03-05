'use strict';

import React from 'react';

import {
  Image,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  Button,
  Card
} from 'react-native-elements';

import { connect } from 'react-redux';

import GameNav from 'features/games/gamenav';


class GameSetup extends React.Component {

  _itemPressed(item) {
    console.log(item);
  }

  render() {

    var content;
    // TODO: if players is blank (new game getting set up), then add the
    //       current logged in player
    var players = [];

    if( this.props.gamespec ) {
      content = (
        <View>
          <GameNav
            title='Game Setup'
            showBack={true}
            showScore={false} />
          <View style={styles.container}>
            <View style={styles.gname}>
              <Text style={styles.name_txt}>{this.props.gamespec.name}</Text>
            </View>

            <Card title="Players, Course, Tees">
              {
                players.map((p, i) => {
                  return (
                    <View key={i} style={styles.player}>
                      <Image
                        style={styles.image}
                        resizeMode="cover"
                        source={{ uri: p.avatar }}
                      />
                      <Text style={styles.pname}>{p.name}</Text>
                    </View>
                  );
                })
              }
              <Button
                title='Add Player'
              />
            </Card>

            <Card title="Options">
            </Card>

          </View>
        </View>
      );
    } else {
      content = (
        <Text>Loading...</Text>
      );
    }

    return (
      <View>
        {content}
      </View>
    );

  }
}

function mapState(state) {
  return {
  };
}

const actions = {
};

export default connect(mapState, actions)(GameSetup);


const styles = StyleSheet.create({
  container: {},
  gname: {
    alignItems: 'center',

  }
});
