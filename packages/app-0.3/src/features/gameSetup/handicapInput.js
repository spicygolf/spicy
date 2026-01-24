import { course_handicap, formatCourseHandicap } from "common/utils/handicap";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Input } from "react-native-elements";

const HandicapInput = (props) => {
  const { label, init, update, showCourse, tee, holes } = props;
  const [handicap, setHandicap] = useState(init);
  const [valid, setValid] = useState(true);
  const ch =
    showCourse === "true" ? course_handicap(handicap, tee, holes) : null;

  const validate = (h) => {
    if (h === "") {
      setValid(true);
      return;
    }
    // matches plus sign, one decimal, and digits
    const match = h.match(/^\+?\d*\.?(?:\d{1,2})?$/);
    setValid(match?.length > 0);
  };

  const rightContent =
    showCourse === "true" ? (
      <View style={styles.field}>
        <Text style={styles.label}>Course Handicap</Text>
        <View style={styles.field_display_view}>
          <Text style={styles.field_display}>{formatCourseHandicap(ch)}</Text>
        </View>
      </View>
    ) : (
      <Text style={styles.field} />
    );

  return (
    <View style={styles.fields_row}>
      <View style={styles.field}>
        <Input
          label={label}
          labelStyle={styles.label}
          containerStyle={styles.field_input}
          inputStyle={styles.field_input_txt}
          errorMessage={valid ? "" : "Please enter a valid handicap"}
          onChangeText={(text) => {
            validate(text);
            setHandicap(text);
          }}
          onEndEditing={() => {
            if (handicap !== init) {
              update(handicap);
            }
          }}
          keyboardType="phone-pad"
          value={formatCourseHandicap(handicap.toString())}
        />
      </View>
      {rightContent}
    </View>
  );
};

export default HandicapInput;

const styles = StyleSheet.create({
  field: {
    flex: 1,
  },
  field_display: {
    fontSize: 18,
    justifyContent: "center",
    padding: 5,
  },
  field_display_view: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 22,
  },
  field_input: {
    color: "#000",
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  field_input_txt: {
    fontSize: 16,
  },
  fields_row: {
    flexDirection: "row",
  },
  label: {
    color: "#999",
    fontSize: 12,
    fontWeight: "normal",
  },
});
