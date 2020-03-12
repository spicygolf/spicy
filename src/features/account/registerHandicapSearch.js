import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  ListItem,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

import { build_qs } from 'common/utils/account';
import { baseUrl } from 'common/config';



const RegisterHandicapSearch = props => {

  const { registration, setRegistration } = props;
  const navigation = useNavigation();
  const [ golfers, setGolfers ] = useState([]);
  const [ fetched, setFetched ] = useState(false);

  let endpoint = 'login';
  let qs = build_qs({
    ghinNumber: registration.ghinNumber,
    lastName: registration.lastName,
  });
  if( !registration.ghinNumber ) {
    endpoint = 'search';
    qs = ``;
  }

  const renderGolfer = ({item}) => {
    console.log('golfer', item);
    return (
      <ListItem
        title={item.PlayerName}
        subtitle={item.ClubName}
      />
    );
  };

  let cardContent = (<ActivityIndicator />);

  useEffect(
    () => {
      const fetchData = async () => {
        const url = `${baseUrl}/ghin/player/${endpoint}?${qs}`;
        const res = await fetch(url, {
          method: 'GET',
        });
        const json = await res.json();
        setGolfers(json.golfers);
        setFetched(true);
      };
      fetchData();
    }, []
  );

  if( fetched ) {
    cardContent = (
      <FlatList
        data={golfers}
        renderItem={renderGolfer}
        keyExtractor={g => g.GHINNumber}
      />
    );
  }
  return (
    <View style={styles.container}>
      <Card
        title='GHIN Results'
      >
        { cardContent }
      </Card>
      <View style={styles.button_row}>
        <Button
          style={styles.prev}
          title='Prev'
          type='solid'
          onPress={() => {
            navigation.navigate('Register', {c: registration.prev});
          }}
          accessibilityLabel='Register Prev 3'
          testID='register_prev_3_button'
        />
        <Button
          style={styles.next}
          title='Next'
          type={'solid'}
          disabled={false}
          onPress={() => {
            setRegistration({
              ...registration,
              prev: 3,
            });
            navigation.navigate('Register', {c: 4})
          }}
          accessibilityLabel='Register Next 3'
          testID='register_next_3_button'
        />
      </View>
    </View>
  );
};

export default RegisterHandicapSearch;


const styles = StyleSheet.create({
  container: {
  },
  button_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  prev: {
    width: 150,
  },
  next: {
    width: 150,
  },
});
