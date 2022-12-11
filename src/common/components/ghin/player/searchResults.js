import { useLazyQuery } from '@apollo/client';
import { GhinPlayerSearchContext } from 'common/components/ghin/player/searchContext';
import { SEARCH_PLAYER_QUERY } from 'features/players/graphql';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { ListItem } from 'react-native-elements';

const GhinPlayerSearchResults = (props) => {
  const { state, setState } = useContext(GhinPlayerSearchContext);
  //console.log('ghin player search results context', state);

  const [page, setPage] = useState(1);
  const [golfers, setGolfers] = useState([]);
  const perPage = 25;

  // console.log(state, page, golfers);

  const handicap = (h) => (
    <View>
      <Text style={styles.handicap}>{h}</Text>
    </View>
  );

  const keyExtractor = (g) => `${g.id}-${g.clubs[0]?.id}-${g.playerName}`;

  const renderGolfer = ({ item }) => {
    // console.log('golfer', item);
    const fn = item.firstName;
    const gn = item.id;
    const key = keyExtractor(item);
    const player_name = item.playerName;
    const player_club = item.clubs[0]?.name;
    const hdcp = item.index;

    return (
      <ListItem
        containerStyle={styles.container}
        key={key}
        onPress={() => {
          setState({
            country: state.country,
            state: state.state,
            firstName: state.firstName,
            lastName: state.lastName,
            handicap: {
              source: 'ghin',
              id: gn,
            },
            name: player_name,
            short: fn,
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

  const [search, { loading, error, data }] = useLazyQuery(SEARCH_PLAYER_QUERY, {
    variables: {
      q: {
        source: 'ghin',
        country: state.country,
        state: state.state,
        firstName: state.firstName,
        lastName: state.lastName,
      },
      p: {
        page,
        perPage,
      },
    },
  });

  const fetchData = useCallback(async () => {
    search();
    if (data && data.searchPlayer && data.searchPlayer) {
      if (page === 1) {
        setGolfers(data.searchPlayer);
      } else {
        setGolfers(golfers.concat(data.searchPlayer));
      }
    }
  }, [data, golfers, page, search]);

  useEffect(() => {
    setGolfers([]);
    setPage(1);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (page === 1) {
      setGolfers([]);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  let content = <View style={styles.results_list} />;

  if (loading) {
    content = (
      <View style={styles.results_list}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error && error.message !== 'Network request failed') {
    console.log(error);
    // TODO: error component
    return <Text>Error Searching Players: `{error.message}`</Text>;
  }

  if (golfers) {
    // console.log('golfers', data.searchPlayer);

    content = (
      <FlatList
        data={golfers}
        renderItem={renderGolfer}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={0.8}
        onEndReached={async () => {
          // console.log('onEndReached');

          // should only be in 'search' part where we want to peform
          // infinite scroll pagination
          if (state.lastName && state.handicap?.id) {
            return;
          }

          setPage(page + 1);
          fetchData();
        }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.no_results}>No Results</Text>
          </View>
        }
      />
    );
  }

  return content;
};

export default GhinPlayerSearchResults;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  player_club: {
    color: '#999',
    fontSize: 12,
  },
  handicap: {
    fontSize: 24,
  },
  no_results: {
    color: '#999',
    alignSelf: 'center',
    fontSize: 20,
  },
});
