import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Icon,
  ListItem,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

import BackToLogin from 'features/account/backToLogin';
import { RegisterContext } from 'features/account/registerContext';
import { login, search } from 'common/utils/ghin';
import { green } from 'common/colors';



const RegisterHandicapSearch = props => {

  const { registration, setRegistration } = useContext(RegisterContext);
  const navigation = useNavigation();
  const [ golfers, setGolfers ] = useState([]);
  const [ fetched, setFetched ] = useState(false);
  const [ page, setPage ] = useState(1);
  const [ selected, setSelected ] = useState(null);
  const perPage = 25;

  const handicap = h => (
    <View>
      <Text style={styles.handicap}>{h}</Text>
    </View>
  );

  const renderGolfer = ({item}) => {
    //console.log('golfer', item);
    const fn = item.FirstName ? item.FirstName : item.first_name;
    const ln = item.LastName ? item.LastName : item.last_name;
    const gn = item.GHINNumber ? item.GHINNumber : item.ghin;
    const key = item.GHINNumber ? item.SearchValue :
      `${item.ghin}_${item.club_id}`;
    const title = item.PlayerName ? item.PlayerName :
      `${item.first_name} ${item.last_name}`;
    const subtitle = item.ClubName ? item.ClubName : item.club_name;
    const hdcp = item.Display ? item.Display : item.handicap_index;

    const leftAvatarColor = (gn == selected) ? green : '#fff';

    return (
      <ListItem
        key={key}
        title={title}
        subtitle={subtitle}
        leftAvatar={(
          <Icon
            name='check-circle'
            type='material-community'
            color={leftAvatarColor}
            size={30}
          />
        )}
        rightElement={handicap(hdcp)}
        onPress={() => {
          if( selected ) {
            setSelected(null);
            setRegistration({
              ...registration,
              ghin_creds: null,
              name: '',
              short: '',
            })
          } else {
            setSelected(gn);
            setRegistration({
              ...registration,
              ghin_creds: {
                lastName: ln,
                ghinNumber: gn,
              },
              name: title,
              short: fn,
            });
          }
        }}
      />
    );
  };

  let cardContent = (<ActivityIndicator />);

  useEffect(
    () => {
      const fetchData = async () => {
        let search_results = [];
        if( registration.lastName && registration.ghinNumber ) {
          search_results = await login(
            registration.ghinNumber,
            registration.lastName
          );
          setGolfers(search_results);
          setFetched(true);
          return;
        }
        if( registration.lastName && registration.state ) {
          search_results = await search(
            registration.state,
            registration.lastName,
            1,  // don't use page here, cuz infinite scroll pagination below
            perPage,
          );
          setGolfers(search_results);
          setFetched(true);
          return;
        }
      };
      fetchData();
    }, []
  );

  if( fetched ) {
    cardContent = (
      <FlatList
        data={golfers}
        renderItem={renderGolfer}
        keyExtractor={g => (
          g.GHINNumber ? g.SearchValue : `${g.ghin}_${g.club_id}`
        )}
        onEndReachedThreshold={0.8}
        onEndReached={async () => {
          //console.log('onEndReached');

          // should only be in 'search' part where we want to peform
          // infinite scroll pagination
          if( registration.lastName && registration.ghinNumber ) return;

          const search_results = await search(
            registration.state,
            registration.lastName,
            page+1,
            perPage,
          );
          setGolfers(golfers.concat(search_results));
          setPage(page+1);
          console.log('page fetched', page);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.title_view}>
          <Text style={styles.title}>Register - GHIN Results</Text>
          <Text>(please click one to proceed)</Text>
        </View>
        { cardContent }
      </View>
      <View style={styles.button_row}>
        <Button
          style={styles.prev}
          title='Prev'
          type='solid'
          onPress={() => {
            navigation.goBack();
          }}
          accessibilityLabel='Register Prev 3'
          testID='register_prev_3_button'
        />
        <Button
          style={styles.next}
          title='Next'
          type={selected ? 'solid' : 'outline'}
          disabled={!selected}
          onPress={() => {
            navigation.navigate('RegisterPlayer');
          }}
          accessibilityLabel='Register Next 3'
          testID='register_next_3_button'
        />
      </View>
      <BackToLogin />
    </View>
  );
};

export default RegisterHandicapSearch;


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 0.9,
    margin: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title_view: {
    alignItems: 'center',
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  handicap: {
    fontSize: 24,
  },
  button_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    flex: 0.1,
  },
  prev: {
    width: 150,
  },
  next: {
    width: 150,
  },
});
