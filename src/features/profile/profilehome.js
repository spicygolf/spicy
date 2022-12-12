import { useQuery } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { blue, light } from 'common/colors';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { GET_PLAYER_QUERY } from 'features/players/graphql';
import FollowersStat from 'features/profile/stats/followers';
import FollowingStat from 'features/profile/stats/following';
import GamesStat from 'features/profile/stats/games';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Card, Icon, ListItem } from 'react-native-elements';

const ProfileHome = (props) => {
  const navigation = useNavigation();
  const [handicapContent, setHandicapContent] = useState(null);
  const { currentPlayer } = useContext(CurrentPlayerContext);
  const pkey = currentPlayer && currentPlayer._key ? currentPlayer._key : null;

  const { loading, error, data } = useQuery(GET_PLAYER_QUERY, {
    variables: {
      player: pkey,
    },
    fetchPolicy: 'cache-and-network',
  });

  const getField = (field) => {
    if (currentPlayer && currentPlayer[field]) {
      return currentPlayer[field];
    }
    return '';
  };

  //console.log('currentPlayer', currentPlayer);

  const name = getField('name');
  const short = getField('short');

  useEffect(() => {
    if (loading) {
      setHandicapContent(<ActivityIndicator />);
    }
    if (error) {
      console.log('error fetching handicap: ', error.message);
    }
    if (data?.getPlayer?.handicap?.source) {
      const { source, index, revDate } = data.getPlayer.handicap;
      // console.log('data', source, index, revDate);
      setHandicapContent(
        <View style={styles.handicap_view}>
          <Text style={styles.source}>{source.toUpperCase()}® linked</Text>
          <Text style={styles.index}>{index}</Text>
          <Text style={styles.revDate}>{revDate}</Text>
        </View>,
      );
    } else {
      setHandicapContent(
        <View style={styles.no_hc_link_view}>
          <View>
            <Text style={styles.no_hc_link_txt}>no handicap</Text>
            <Text style={styles.no_hc_link_txt}>service linked</Text>
          </View>
          <Button
            type="clear"
            icon={<Icon name="add-link" type="material" size={36} color={blue} />}
            onPress={() => {
              navigation.navigate('LinkHandicap');
            }}
          />
        </View>,
      );
    }
  }, [loading, error, data, navigation]);

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Card wrapperStyle={styles.card_wrapper}>
          <ListItem>
            <Icon name="settings" type="material" color="transparent" size={24} />
            <ListItem.Content style={styles.name_view}>
              <ListItem.Title style={styles.name}>{name}</ListItem.Title>
              <ListItem.Subtitle style={styles.short}>{short}</ListItem.Subtitle>
            </ListItem.Content>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Icon name="settings" type="material" color={light} size={24} />
            </TouchableOpacity>
          </ListItem>
          <View style={styles.subname_view}>
            {handicapContent}
            <View style={styles.stats_view}>
              <GamesStat pkey={pkey} />
              <FollowingStat pkey={pkey} />
              <FollowersStat pkey={pkey} />
            </View>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card_wrapper: {
    marginBottom: 20,
  },
  name_view: {
    marginVertical: 10,
    alignItems: 'center',
  },
  name: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    paddingBottom: 3,
  },
  short: {
    textAlign: 'center',
    fontSize: 12,
    paddingBottom: 10,
  },
  subname_view: {
    flexDirection: 'row',
  },
  handicap_view: {
    flex: 1,
  },
  source: {
    alignSelf: 'center',
  },
  index: {
    alignSelf: 'center',
    fontSize: 28,
    fontWeight: 'bold',
  },
  revDate: {
    alignSelf: 'center',
    fontSize: 8,
  },
  no_hc_link_view: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  no_hc_link_txt: {
    fontSize: 11,
    alignSelf: 'center',
  },
  stats_view: {
    flexDirection: 'row',
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_view: {
    marginTop: 40,
  },
});
