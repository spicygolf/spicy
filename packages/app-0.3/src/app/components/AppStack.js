import AsyncStorage from '@react-native-async-storage/async-storage';
import AppStackTabs from 'app/components/AppStackTabs';
import Error from 'common/components/error';
import { useLoginQuery } from 'features/account/hooks/useLoginQuery';
// import RegisterAgain from 'features/account/registerAgain';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';

const AppStack = ({ email, fbToken, fbUser }) => {
  // eslint-disable-next-line no-unused-vars
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [impersonate, setImpersonate] = useState(null);

  const { loading, data, error } = useLoginQuery({
    variables: {
      email,
      fbToken,
    },
  });

  if (loading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Error error={error} />;
  }

  if (data?.login) {
    const { player, message } = data.login;
    if (message === 'user_logged_in') {
      AsyncStorage.setItem('token', player.token);
      return (
        <CurrentPlayerContext.Provider
          value={{
            currentPlayer: player,
            setCurrentPlayer,
            impersonate,
            setImpersonate,
            user: fbUser,
          }}>
          <AppStackTabs />
        </CurrentPlayerContext.Provider>
      );
    }
  }
};

export default AppStack;
