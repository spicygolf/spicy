import { useContext } from "react";
import { GhinPlayerSearchContext } from "@/contexts/GhinPlayerSearchContext";
// import {
//   ActivityIndicator,
//   FlatList,
//   StyleSheet,
//   View,
// } from "react-native";
// import { Text } from "@/ui";

export function GhinPlayerSearchResults() {
  const { state, setState: _ } = useContext(GhinPlayerSearchContext);
  console.log("ghin player search", state);
  return null;

  // const [page, setPage] = useState(1);
  // const [golfers, setGolfers] = useState([]);
  // const perPage = 25;

  // const handicap = (h) => (
  //   <View>
  //     <Text style={styles.handicap}>{h}</Text>
  //   </View>
  // );

  // const keyExtractor = (g) => `${g?.id}-${g?.clubs[0]?.id}-${g?.playerName}`;

  // const renderGolfer = ({ item }) => {
  //   if (!item) {
  //     return null;
  //   }
  //   const fn = item.firstName;
  //   const gn = item.id;
  //   const key = keyExtractor(item);
  //   const player_name = item.playerName;
  //   const player_club = item.clubs[0]?.name;
  //   const hdcp = item.index;

  //   return (
  //     <ListItem
  //       containerStyle={styles.container}
  //       key={key}
  //       onPress={() => {
  //         setState({
  //           country: state.country,
  //           state: state.state,
  //           first_name: state.firstName,
  //           last_name: state.lastName,
  //           handicap: {
  //             source: "ghin",
  //             id: gn,
  //             index: hdcp,
  //           },
  //           name: player_name,
  //           short: fn,
  //         });
  //       }}
  //     >
  //       <ListItem.Content style={styles.container}>
  //         <ListItem.Title style={styles.player_name}>
  //           {player_name}
  //         </ListItem.Title>
  //         <ListItem.Subtitle style={styles.player_club}>
  //           {player_club}
  //         </ListItem.Subtitle>
  //       </ListItem.Content>
  //       {handicap(hdcp)}
  //     </ListItem>
  //   );
  // };

  // const { loading, error, data } = useQuery(SEARCH_PLAYER_QUERY, {
  //   variables: {
  //     q: {
  //       country: state.country,
  //       state: state.state,
  //       first_name: state.firstName,
  //       last_name: state.lastName,
  //       status: "Active",
  //     },
  //     p: {
  //       page,
  //       perPage,
  //     },
  //   },
  // });

  // // if state changes at all, reset everything
  // useEffect(() => {
  //   setPage(1);
  //   setGolfers([]);
  // }, [state]);

  // // when new data arrives, add it to `golfers` array
  // useEffect(() => {
  //   setGolfers((g) => g.concat(data?.searchPlayer));
  // }, [data]);

  // if (loading) {
  //   return (
  //     <View style={styles.results_list}>
  //       <ActivityIndicator />
  //     </View>
  //   );
  // }

  // if (error && error.message !== "Network request failed") {
  //   console.log(error);
  //   // TODO: error component
  //   return <Text>Error Searching Players: `{error.message}`</Text>;
  // }

  // // console.log(state, page, data?.searchPlayer, golfers.length);

  // return (
  //   <FlatList
  //     data={golfers}
  //     renderItem={renderGolfer}
  //     keyExtractor={keyExtractor}
  //     onEndReachedThreshold={0.8}
  //     onEndReached={async () => {
  //       // should only be in 'search' part where we want to peform
  //       // infinite scroll pagination
  //       if (state.lastName && state.handicap?.id) {
  //         return;
  //       }

  //       // data is as long as perPage, so we're not at end yet
  //       if (data.searchPlayer.length === perPage) {
  //         setPage((p) => p + 1);
  //       }
  //     }}
  //     keyboardShouldPersistTaps="handled"
  //     ListEmptyComponent={
  //       <View style={styles.emptyContainer}>
  //         <Text style={styles.no_results}>No Results</Text>
  //       </View>
  //     }
  //   />
  // );
}

// const styles = StyleSheet.create({
//   container: {
//     marginHorizontal: 0,
//     paddingHorizontal: 5,
//     paddingVertical: 4,
//   },
//   emptyContainer: {
//     flex: 1,
//   },
//   handicap: {
//     fontSize: 20,
//   },
//   no_results: {
//     alignSelf: "center",
//     color: "#999",
//     fontSize: 20,
//   },
//   player_club: {
//     color: "#999",
//     fontSize: 11,
//   },
// });
