import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Icon,
} from 'react-native-elements';
import { find, orderBy } from 'lodash';

import { blue } from 'common/colors';



const TeamJunk = props => {

  const { team: teamNum, scoring, currentHole } = props;

  const renderJunk = junk => {

    if( junk.show_in == 'none' ) return null;

    // TODO: junk.name needs l10n, i18n - use junk.name as slug
    const type = 'solid';
    const color = 'white';

    return (
      <Button
        title={junk.name}
        icon={
          <Icon
            style={styles.icon}
            name={junk.icon}
            size={20}
            color={color}
          />}
        type={type}
        buttonStyle={styles.button}
        titleStyle={styles.buttonTitle}
      />
    );

  };

  const hole = find(scoring.holes, { hole: currentHole });
  if( !hole ) return null;

  const team = find(hole.teams, {team: teamNum});
  if( !team ) return null;

  const sorted_junk = orderBy(team.junk, ['seq'], ['asc']);
  //console.log('sorted_junk', sorted_junk);
  if( sorted_junk.length == 0 ) return null;

  return (
    <View style={styles.container}>
      <FlatList
        horizontal={true}
        data={sorted_junk}
        renderItem={({item}) => renderJunk(item)}
        keyExtractor={item => item.seq.toString()}
      />
    </View>
  );
};

export default TeamJunk;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
  },
  icon: {
    padding: 5,
  },
  button: {
    padding: 2,
    marginLeft: 5,
    borderColor: blue,
  },
  buttonTitle: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 13,
  },
});