import React, { useContext } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Card,
  Button,
  Icon,
  ListItem,
} from 'react-native-elements';
import DeviceInfo from 'react-native-device-info';
import { useNavigation } from '@react-navigation/native';

import { blue, light } from 'common/colors';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import GamesStat from 'features/profile/stats/games';
import FollowingStat from 'features/profile/stats/following';
import FollowersStat from 'features/profile/stats/followers';



const ProfileHome = props => {

  const navigation = useNavigation();

  const {
    currentPlayer,
  } = useContext(CurrentPlayerContext);
  const pkey = currentPlayer._key;

  const getField = field => {
    if( currentPlayer && currentPlayer[field] ) {
      return currentPlayer[field];
    }
    return '';
  };

  const getHandicapField = field => {
    if( currentPlayer && currentPlayer.handicap && currentPlayer.handicap[field] ) {
      return currentPlayer.handicap[field];
    }
    return '';
  };

  const handicapContent = ({source, index, revDate}) => {
    if( source ) {
      return (
        <View style={styles.handicap_view}>
          <Text style={styles.source}>{source} linked</Text>
          <Text style={styles.index}>{index}</Text>
          <Text style={styles.revDate}>{revDate}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.no_hc_link_view}>
          <View>
            <Text style={styles.no_hc_link_txt}>no handicap</Text>
            <Text style={styles.no_hc_link_txt}>service linked</Text>
          </View>
          <Button
            type='clear'
            icon={
              <Icon
                name='add-link'
                type='material'
                size={36}
                color={blue}
              />
            }
            onPress={() => { navigation.navigate('LinkHandicap'); }}
          />
        </View>
      );
    }
  };

  //console.log('currentPlayer', currentPlayer);

  const name = getField('name');
  const short = getField('short');

  let source = getHandicapField('source').toUpperCase();
  const index = getHandicapField('index');
  const revDate = getHandicapField('revDate');

  const handicap_content = handicapContent({source, index, revDate});

  const version = DeviceInfo.getVersion();


  return (
    <KeyboardAvoidingView style={{flex: 1,}}>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <Card wrapperStyle={styles.card_wrapper}>
          <ListItem>
          <Icon
              name='settings'
              type='material'
              color='transparent'
              size={24}
            />
            <ListItem.Content style={styles.name_view}>
              <ListItem.Title style={styles.name}>{name}</ListItem.Title>
              <ListItem.Subtitle style={styles.short}>{short}</ListItem.Subtitle>
            </ListItem.Content>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
            >
              <Icon
                name='settings'
                type='material'
                color={light}
                size={24}
              />
            </TouchableOpacity>
          </ListItem>
          <View style={styles.subname_view}>
            { handicap_content }
            <View style={styles.stats_view}>
              <GamesStat pkey={pkey} />
              <FollowingStat pkey={pkey} />
              <FollowersStat pkey={pkey} />
            </View>
          </View>
        </Card>
      </ScrollView>
      <View style={styles.app_info}>
          <Text>v{version}</Text>
        </View>
    </KeyboardAvoidingView>
  );

};

export default ProfileHome;


const styles = StyleSheet.create({
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
  app_info: {
    marginHorizontal: 15,
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
