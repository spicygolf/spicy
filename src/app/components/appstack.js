import { useLazyQuery } from '@apollo/client';
import AsyncStorage from '@react-native-community/async-storage';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { blue, green, red } from 'common/colors';
import { getCurrentUser } from 'common/utils/account';
import RegisterAgain from 'features/account/registerAgain';
import FeedStack from 'features/feed/feedstack';
import GamesStack from 'features/games/gamesstack';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { GET_PLAYER_QUERY } from 'features/players/graphql';
import ProfileStack from 'features/profile/profilestack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Icon } from 'react-native-elements';

const TabIcon = ({ type, name, color, testID }) => {
  return <Icon size={24} color={color} type={type} name={name} testID={testID} />;
};

const AppStack = (props) => {
  const [content, setContent] = useState(<ActivityIndicator />);

  const { user } = props;

  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentPlayerKey, setCurrentPlayerKey] = useState(null);
  const [token, setToken] = useState(null);
  const [impersonate, setImpersonate] = useState(null);

  const [getCurrentPlayer, { error, data }] = useLazyQuery(GET_PLAYER_QUERY);

  useEffect(() => {
    const getCreds = async () => {
      // console.log('user', user);
      const c = await getCurrentUser(user);
      // console.log('getCreds', c);
      if (c && c.currentPlayerKey && c.token) {
        setCurrentPlayerKey(c.currentPlayerKey);
        setToken(c.token);
        await AsyncStorage.setItem('currentPlayer', c.currentPlayerKey);
        await AsyncStorage.setItem('token', c.token);
        setContent(tabs());
      } else {
        if (c && c.message) {
          // try to get creds from local storage
          const newCurrentPlayerKey = await AsyncStorage.getItem('currentPlayer');
          const newToken = await AsyncStorage.getItem('token');
          if (newToken && newCurrentPlayerKey) {
            // TODO: DRY (above)
            setCurrentPlayerKey(newCurrentPlayerKey);
            setToken(newToken);
            setContent(tabs());
          } else {
            console.log('something is wrong:', c);
            if (c.navTo) {
              switch (c.navTo) {
                case 'RegisterAgain':
                  setContent(<RegisterAgain fbUser={c.fbUser} retryCreds={getCreds} />);
                  break;
                default:
                  //setContent(<Alert message={c.message} />);
                  break;
              }
            } else {
              // TODO: navigate to an Error component
              //setContent(<Alert message={c.message} />);
            }
          }
        }
      }
    };

    getCreds();
  }, [user]);

  useEffect(
    () => {
      // console.log('cp', currentPlayerKey, token);
      if (currentPlayerKey && token) {
        getCurrentPlayer({
          variables: {
            player: currentPlayerKey,
          },
          fetchPolicy: 'cache-and-network',
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPlayerKey, token],
  );

  useEffect(() => {
    // console.log('data', data);
    if (data && data.getPlayer) {
      setCurrentPlayer(data.getPlayer);
    }
  }, [data]);

  useEffect(() => {
    if (error && error.message !== 'Network request failed') {
      console.log('Error fetching current player', error);
    }
  }, [error]);

  const tabs = () => {
    const Tab = createMaterialBottomTabNavigator();

    return (
      <Tab.Navigator
        initialRouteName="GamesStack"
        shifting={true}
        activeColor="#fff"
        inactiveColor="#ccc"
      >
        <Tab.Screen
          name="FeedStack"
          component={FeedStack}
          options={{
            title: 'Feed',
            tabBarIcon: ({ focused }) => {
              return (
                <TabIcon
                  color={focused ? '#fff' : '#ccc'}
                  name="comment"
                  type="font-awesome"
                />
              );
            },
            tabBarColor: blue,
            tabBarTestID: 'feed_tab',
          }}
        />
        <Tab.Screen
          name="GamesStack"
          component={GamesStack}
          options={{
            title: 'Games',
            tabBarIcon: ({ focused }) => {
              return (
                <TabIcon
                  color={focused ? '#fff' : '#ccc'}
                  name="edit"
                  type="font-awesome"
                />
              );
            },
            tabBarColor: green,
            tabBarTestID: 'games_tab',
          }}
        />
        <Tab.Screen
          name="ProfileStack"
          component={ProfileStack}
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => {
              return (
                <TabIcon
                  color={focused ? '#fff' : '#ccc'}
                  name="user"
                  type="font-awesome"
                />
              );
            },
            tabBarColor: red,
            tabBarTestID: 'profile_tab',
          }}
        />
      </Tab.Navigator>
    );
  };

  // console.log('content', content);

  return (
    <CurrentPlayerContext.Provider
      value={{
        currentPlayer,
        setCurrentPlayer,
        currentPlayerKey,
        setCurrentPlayerKey,
        token,
        setToken,
        impersonate,
        setImpersonate,
        user,
      }}
    >
      {content}
    </CurrentPlayerContext.Provider>
  );
};

export default AppStack;
