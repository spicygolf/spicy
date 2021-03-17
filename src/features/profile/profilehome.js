'use strict';

import React, { useContext } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useApolloClient } from '@apollo/client';
import {
  Card,
  Button,
  Icon,
} from 'react-native-elements';
import DeviceInfo from 'react-native-device-info';
import { useNavigation } from '@react-navigation/native';

import { blue } from 'common/colors';
import { logout } from 'common/utils/account';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import Impersonate from 'features/profile/impersonate';



const ProfileHome = props => {

  const client = useApolloClient();
  const navigation = useNavigation();

  const {
    currentPlayer,
    setCurrentPlayer,
    setCurrentPlayerKey,
    setToken,
  } = useContext(CurrentPlayerContext);


  const _logoutPressed = () => {
    setCurrentPlayer(null);
    setCurrentPlayerKey(null);
    setToken(null);
    logout(client);
  }

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

  console.log('currentPlayer', currentPlayer);

  const name = getField('name');
  const short = getField('short');

  let source = getHandicapField('source').toUpperCase();
  const index = getHandicapField('index');
  const revDate = getHandicapField('revDate');

  const _clearCache = async () => {
    await client.clearStore();
    client.cache.data.clear();
/*
    for( const key of Object.keys(client.cache.data.data) ) {
      const e = client.cache.evict({id: key});
      console.log('evict', key, e);
    }
    const gc = client.cache.gc();
    console.log('gc', gc);
*/
    console.log('cache', client.cache.data.data);
  }

  const handicap_content = handicapContent({source, index, revDate});

  const version = DeviceInfo.getVersion();

  const impersonate = (currentPlayer && currentPlayer.level && currentPlayer.level == 'admin' )
    ? (<Impersonate clearCache={_clearCache} />)
    : null;

  return (
    <KeyboardAvoidingView style={{flex: 1,}}>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <Card>
          <View style={styles.name_view}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.short}>{short}</Text>
          </View>
          <View style={styles.subname_view}>
            { handicap_content }
            <View style={styles.stats_view}>
              <View style={styles.stat_view}>
                <View><Text style={styles.stat_value}>98</Text></View>
                <View><Text style={styles.stat_label}>games</Text></View>
              </View>
              <View style={styles.stat_view}>
                <View><Text style={styles.stat_value}>23</Text></View>
                <View><Text style={styles.stat_label}>following</Text></View>
              </View>
              <View style={styles.stat_view}>
                <View><Text style={styles.stat_value}>1</Text></View>
                <View><Text style={styles.stat_label}>followers</Text></View>
              </View>
            </View>
          </View>
        </Card>
        <Card>
          <Button
            buttonStyle={styles.button}
            title='Settings'
            titleStyle={styles.settings_button_title}
            icon={
              <Icon
                name='settings'
                type='material'
                color='#fff'
                size={24}
              />
            }
            testID='settings_button'
            onPress={() => console.log('settings')}
          />
          <Button
            buttonStyle={styles.button}
            title='Clear Local Data'
            testID='clear_cache_button'
            onPress={() => _clearCache()}
          />
          <Button
            buttonStyle={styles.button}
            title='Logout'
            testID='logout_button'
            onPress={() => _logoutPressed()}
          />
        </Card>
        { impersonate }
      </ScrollView>
      <View style={styles.app_info}>
          <Text>v{version}</Text>
        </View>
    </KeyboardAvoidingView>
  );

};

export default ProfileHome;


const styles = StyleSheet.create({
  name_view: {
    marginVertical: 10,
    alignSelf: 'center',
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
  stat_view: {
    paddingHorizontal: 5,
  },
  stat_value: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  stat_label: {
    textAlign: 'center',
    fontSize: 11,
  },
  button_view: {
    marginTop: 40,
  },
  button: {
    margin: 10,
  },
  settings_button_title: {
    paddingHorizontal: 10,
  },
  app_info: {
    marginHorizontal: 15,
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
