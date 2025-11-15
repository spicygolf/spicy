import type { CourseSearchRequest } from "@spicygolf/ghin";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useGhinCourseSearchContext } from "@/contexts/GhinCourseSearchContext";
import { useGetCountriesAndStates } from "@/hooks/useGetCountriesAndStates";
import { Input, Picker } from "@/ui";

export function GhinCourseSearchInput() {
  const { state, setState } = useGhinCourseSearchContext();
  const { countries } = useGetCountriesAndStates();

  const handleChange = (data: CourseSearchRequest) => setState(data);

  const country = countries?.find((c) => c?.code === state.country);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.field}>
          <Input
            name="course_name"
            label="Course Name"
            value={state.name || ""}
            onChangeText={(value) => handleChange({ ...state, name: value })}
            autoCapitalize="words"
            placeholder="Enter course name"
          />
        </View>
      </View>
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
                      value: s.course_code,
                    },
                  ]
                : [],
            )}
            selectedValue={state.state}
            onValueChange={(value) => handleChange({ ...state, state: value })}
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
