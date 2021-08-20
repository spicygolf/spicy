import FavoriteIcon from 'common/components/favoriteIcon';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ListItem } from 'react-native-elements';

const handicap = (h) => (
  <View>
    <Text style={styles.handicap}>{h}</Text>
  </View>
);

const Player = (props) => {
  const { item, testID, title, subtitle, hdcp, onPress } = props;
  //console.log('player', item);

  return (
    <ListItem onPress={() => onPress(item)} testID={`add_player_favorites_${testID}`}>
      <FavoriteIcon fave={item.fave} />
      <ListItem.Content>
        <ListItem.Title>{title}</ListItem.Title>
        <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>
      </ListItem.Content>
      {handicap(hdcp)}
    </ListItem>
  );
};

export default Player;

const styles = StyleSheet.create({
  handicap: {
    fontSize: 24,
    paddingRight: 10,
  },
});
