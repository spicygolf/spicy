import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ListItem
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import FavoriteIcon from 'common/components/favoriteIcon';



const handicap = h => (
  <View>
    <Text style={styles.handicap}>{h}</Text>
  </View>
);

const Player = props => {

  const navigation = useNavigation();

  const { game, item, title, subtitle, hdcp } = props;
  //console.log('player', item);

  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      rightElement={handicap(hdcp)}
      onPress={() => {
        //console.log('player pressed', item);
        const player =  {
          _key: item._key,
          name: item.name,
          handicap: item.handicap,
        };
        navigation.navigate('LinkRoundList', {
          game: {
            _key: game._key,
            start: game.start,
          },
          player: player,
        });
      }}
      leftIcon={(
        <FavoriteIcon
          fave={item.fave}
        />
      )}
    />
  );

};

export default Player;


const styles = StyleSheet.create({
  handicap: {
    fontSize: 24,
    paddingRight: 10,
  },
});