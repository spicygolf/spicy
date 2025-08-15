import type { GolfersSearchRequest } from "ghin";
import { useContext } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { GhinPlayerSearchContext } from "@/contexts/GhinPlayerSearchContext";
import { useGetCountriesAndStates } from "@/hooks/useGetCountriesAndStates";
import { Input, Picker } from "@/ui";
// import Error from '@/components/error';

export function GhinPlayerSearchInput() {
  const context = useContext(GhinPlayerSearchContext);
  const { countries } = useGetCountriesAndStates();

  if (!context) {
    throw new Error(
      "GhinPlayerSearchInput must be used within a GhinPlayerSearchContext.Provider",
    );
  }

  const { state, setState } = context;
  const handleChange = (data: GolfersSearchRequest) => setState(data);

  const country = countries?.find((c) => c?.code === state.country);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.picker_country}>
          <Picker
            title="Country"
            items={(countries ?? []).flatMap((c) =>
              c
                ? [
                    {
                      label: c.name,
                      value: c.code,
                    },
                  ]
                : [],
            )}
            selectedValue={state.country}
            onValueChange={(value) =>
              handleChange({ ...state, country: value })
            }
          />
        </View>
        <View style={styles.picker_state}>
          <Picker
            title="State/Province"
            items={(country?.states ?? []).flatMap((s) =>
              s
                ? [
                    {
                      label: s.name,
                      value: s.code,
                    },
                  ]
                : [],
            )}
            selectedValue={state.state}
            onValueChange={(value) => handleChange({ ...state, state: value })}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.field, styles.last_name]}>
          <Input
            name="last_name"
            label="Last Name"
            value={state.last_name}
            onChangeText={(value) =>
              handleChange({ ...state, last_name: value })
            }
            autoCapitalize="words"
          />
        </View>
        <View style={styles.field}>
          <Input
            name="first_name"
            label="First Name (optional)"
            value={state.first_name || ""}
            onChangeText={(value) =>
              handleChange({ ...state, first_name: value })
            }
            autoCapitalize="words"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
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
    paddingVertical: theme.gap(0.5),
  },
}));
