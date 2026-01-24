import Error from "common/components/error";
import { GhinPlayerSearchContext } from "common/components/ghin/player/searchContext";
import { useGetCountriesAndStatesQuery } from "common/hooks/useGetCountriesAndStatesQuery";
import CountryPicker from "features/account/countryPicker";
import StatePicker from "features/account/statePicker";
import { find } from "lodash";
import { useContext } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Input } from "react-native-elements";

const GhinPlayerSearchInput = () => {
  const { state, setState } = useContext(GhinPlayerSearchContext);

  const { loading, error, data } = useGetCountriesAndStatesQuery();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Error error={error} />;
  }

  if (data?.getCountriesAndStates) {
    const countries = data?.getCountriesAndStates;

    const c = find(countries, { code: state.country });
    let statelist = [];
    if (c?.states) {
      statelist = c.states;
    }

    return (
      <View style={styles.container}>
        <View style={styles.row}>
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
        </View>
        <View style={styles.row}>
          <View style={styles.field}>
            <Input
              label="Last Name"
              labelStyle={styles.label}
              containerStyle={[styles.field_input, styles.last_name]}
              inputStyle={styles.field_input_txt}
              onChangeText={(text) => {
                setState({
                  ...state,
                  last_name: text,
                });
              }}
              autoCapitalize="words"
              value={state.lastName}
            />
          </View>
          <View style={styles.field}>
            <Input
              label="First Name (optional)"
              labelStyle={styles.label}
              containerStyle={styles.field_input}
              inputStyle={styles.field_input_txt}
              onChangeText={(text) => {
                setState({
                  ...state,
                  first_name: text,
                });
              }}
              autoCapitalize="words"
              value={state.firstName}
            />
          </View>
        </View>
      </View>
    );
  }
};

export default GhinPlayerSearchInput;

const styles = StyleSheet.create({
  container: {},
  field: {
    flex: 1,
  },
  field_input: {
    color: "#000",
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  field_input_txt: {
    fontSize: 16,
  },
  label: {
    color: "#999",
    fontSize: 12,
    fontWeight: "normal",
  },
  last_name: {
    paddingRight: 5,
  },
  picker_country: {
    flex: 1,
    marginRight: 5,
  },
  picker_state: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
  },
});
