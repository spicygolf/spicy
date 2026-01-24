import { GhinCourseSearchContext } from "common/components/ghin/course/searchContext";
import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { Input } from "react-native-elements";

const GhinCourseSearchInput = () => {
  const { search, setSearch } = useContext(GhinCourseSearchContext);

  // const [countries, setCountries] = useState([]);
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const url = `${scheme}://${baseUri}/ghin/countries_and_states`;
  //     const res = await fetch(url, {
  //       method: 'GET',
  //     });
  //     const json = await res.json();
  //     //console.log('countries json', json);
  //     setCountries(json.countries);
  //   };
  //   fetchData();
  // }, []);

  // const c = find(countries, { code: state.country });
  // let statelist = [];
  // if (c && c.states) {
  //   statelist = c.states;
  // }

  //console.log('ghinCourseSearch', ghinCourseSearch);

  return (
    <View style={styles.container}>
      {/* <View style={styles.row}>
        <View style={styles.picker_country}>
          <CountryPicker
            countries={countries}
            selectedValue={state.country}
            onValueChange={(v) =>
              setState({
                ...state,
                country: v,
              })
            }
          />
        </View>
        <View style={styles.picker_state}>
          <StatePicker
            states={statelist}
            selectedValue={state.state}
            onValueChange={(v) =>
              setState({
                ...state,
                state: v,
              })
            }
          />
        </View>
      </View> */}
      <View style={styles.row}>
        <View style={styles.field}>
          <Input
            label="Course Name"
            labelStyle={styles.label}
            containerStyle={[styles.field_input, styles.name]}
            inputStyle={styles.field_input_txt}
            onChangeText={(text) => {
              setSearch({
                ...search,
                name: text,
              });
            }}
            autoCapitalize="words"
            value={search.name}
          />
        </View>
      </View>
    </View>
  );
};

export default GhinCourseSearchInput;

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: "row",
  },
  // picker_country: {
  //   flex: 1,
  //   marginRight: 5,
  // },
  // picker_state: {
  //   flex: 1,
  // },
  field: {
    flex: 1,
  },
  label: {
    color: "#999",
    fontSize: 12,
    fontWeight: "normal",
  },
  field_input: {
    color: "#000",
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  name: {
    paddingRight: 5,
  },
  field_input_txt: {
    fontSize: 16,
  },
});
