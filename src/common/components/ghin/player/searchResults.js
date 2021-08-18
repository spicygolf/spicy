import { GhinPlayerSearchContext } from 'common/components/ghin/player/searchContext';
import { search } from 'common/utils/ghin';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { ListItem } from 'react-native-elements';

const GhinPlayerSearchResults = (props) => {
  const { state, setState } = useContext(GhinPlayerSearchContext);
  //console.log('ghin player search results context', state);

  const [golfers, setGolfers] = useState([]);
  const [fetched, setFetched] = useState(0); // 0 - no search, 1 - fetching, 2 - fetched
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const perPage = 25;

  const handicap = (h) => (
    <View>
      <Text style={styles.handicap}>{h}</Text>
    </View>
  );

  const renderGolfer = ({ item }) => {
    //console.log('golfer', item);
    const fn = item.FirstName ? item.FirstName : item.first_name;
    const ln = item.LastName ? item.LastName : item.last_name;
    const gn = item.GHINNumber ? item.GHINNumber : item.ghin;
    const key = item.GHINNumber ? item.SearchValue : `${item.ghin}_${item.club_id}`;
    const player_name = item.PlayerName
      ? item.PlayerName
      : `${item.first_name} ${item.last_name}`;
    const player_club = item.ClubName ? item.ClubName : item.club_name;
    const hdcp = item.Display ? item.Display : item.handicap_index;
    const revDate = item.RevDate ? item.RevDate : item.rev_date;
    const gender = item.Gender ? item.Gender : item.gender;
    const active = item.Status ? item.Status == 'Active' : item.status == 'Active';

    return (
      <ListItem
        containerStyle={styles.container}
        key={key}
        onPress={() => {
          setSelected(gn);
          setState({
            ...state,
            ghinCreds: {
              lastName: ln,
              ghinNumber: gn,
            },
            handicap: {
              source: 'ghin',
              id: gn,
              firstName: fn,
              lastName: ln,
              gender,
              playerName: player_name,
              active,
              index: hdcp,
              revDate: revDate,
            },
            name: player_name,
            short: fn,
            club: player_club,
          });
        }}
      >
        <ListItem.Content style={styles.container}>
          <ListItem.Title style={styles.player_name}>{player_name}</ListItem.Title>
          <ListItem.Subtitle style={styles.player_club}>{player_club}</ListItem.Subtitle>
        </ListItem.Content>
        {handicap(hdcp)}
      </ListItem>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      let search_results = [];
      setFetched(1); // fetching
      search_results = await search({
        ...state,
        page: 1, // don't use page here, cuz infinite scroll pagination below
        perPage,
      });
      //console.log('search_results', search_results);
      setGolfers(search_results);
      setFetched(2); // fetched
      return;
    };
    fetchData();
  }, [state]);

  let content = <View style={styles.results_list}></View>;

  switch (fetched) {
    case 1:
      content = (
        <View style={styles.results_list}>
          <ActivityIndicator />
        </View>
      );
      break;
    case 2:
      //console.log('golfers', golfers);
      content = (
        <FlatList
          data={golfers}
          renderItem={renderGolfer}
          style={styles.results_list}
          keyExtractor={(g) => (g.GHINNumber ? g.SearchValue : `${g.ghin}_${g.club_id}`)}
          onEndReachedThreshold={0.8}
          onEndReached={async () => {
            //console.log('onEndReached');

            // should only be in 'search' part where we want to peform
            // infinite scroll pagination
            if (state.lastName && state.ghinNumber) return;

            const search_results = await search({
              ...state,
              page: page + 1,
              perPage,
            });
            console.log('infinite scroll search_results', search_results);
            setGolfers(golfers.concat(search_results));
            setPage(page + 1);
            console.log('page fetched', page);
          }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ flex: 1 }}>
              <Text style={styles.no_results}>No Results</Text>
            </View>
          }
        />
      );
      break;
    case 0:
    default:
      break;
  }

  return content;
};

export default GhinPlayerSearchResults;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    marginHorizontal: 0,
  },
  player_club: {
    color: '#999',
    fontSize: 12,
  },
  handicap: {
    fontSize: 24,
  },
  results_list: {},
  no_results: {
    color: '#999',
    alignSelf: 'center',
    fontSize: 20,
  },
});
