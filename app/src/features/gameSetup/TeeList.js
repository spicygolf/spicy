import { getRatings } from 'common/utils/game';
import { GameContext } from 'features/game/gameContext';
import Tee from 'features/gameSetup/Tee';
import React, { useContext } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

const TeeList = (props) => {
  const { tees, showRemove, allowAddToRound } = props;
  const { game } = useContext(GameContext);

  const renderTee = ({ item: tee }) => {
    const { total_par, total_yardage } = tee;
    const par = total_par ? ` - par ${total_par}` : '';
    const distance = total_yardage ? ` - ${total_yardage} yards` : '';
    const { rating, slope } = getRatings(game.scope.holes, tee);
    const title = tee.tee_name;
    const subtitle = `${tee.gender} - ${rating}/${slope}${par}${distance}`;
    return (
      <Tee
        tee={tee}
        title={title}
        subtitle={subtitle}
        showRemove={showRemove}
        allowAddToRound={allowAddToRound}
      />
    );
  };

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={tees}
        renderItem={renderTee}
        keyExtractor={(item) => item.tee_id.toString()}
        keyboardShouldPersistTaps={'handled'}
      />
    </View>
  );
};

export default TeeList;

const styles = StyleSheet.create({
  citystate: {
    color: '#999',
    fontSize: 12,
  },
  listContainer: {
    marginHorizontal: 10,
  },
});
