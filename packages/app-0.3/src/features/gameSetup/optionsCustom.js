import HoleChooser from "common/components/holeChooser";
import { getAllOptions, isBinary } from "common/utils/game";
import { GameContext } from "features/game/gameContext";
import GameNav from "features/games/gamenav";
import { cloneDeep, find } from "lodash";
import { useContext } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import OptionAddValue from "./optionAddValue";

const OptionsCustom = (props) => {
  const { route } = props;
  const { params } = route;
  const { okey, setOption } = params;

  const { game } = useContext(GameContext);
  const allOptions = getAllOptions({ game, type: "game" });
  const option = find(allOptions, (o) => o.key === okey);
  // console.log('OptionsCustom option.values', option.values);

  const addOptionValue = (newValue) => {
    if (!newValue || newValue === "") {
      return;
    }
    const o = cloneDeep(option);
    o.values.push({ __typename: "OptionValue", value: newValue, holes: [] });
    setOption(o);
  };

  const setHoles = ({ item, hole, newValue }) => {
    // console.log('setHoles', item, hole, newValue, option);

    const o = cloneDeep(option);
    const selected = newValue === true;

    // loop thru existing option to build new option
    //  add hole to matching item.value, and remove from all other option values
    o.values = o.values.map((ov) => {
      // console.log('ov before', ov);
      if (ov.value === item.value) {
        // this ov is same as clicked
        if (selected) {
          ov.holes.push(hole);
        } else {
          // deselected
          ov.holes = ov.holes.filter((h) => h !== hole);
        }
      } else {
        // this ov is not same as clicked, removing from all ones not clicked
        ov.holes = ov.holes.filter((h) => h !== hole);
      }
      // console.log('ov after', ov);
      if (ov.holes.length > 0 || !isBinary(o)) {
        return ov;
      }
    });
    o.values = o.values.filter((v) => v); // gets rid of undefined
    // console.log('o.values 1', o.values);

    // If this was a deselect, meaning we're turning it off for a value
    // check to see if value should be in other option.values - if so, add it
    //  (bool types and menu types with only two options)
    if (!selected) {
      let otherOptionValue;
      if (o.sub_type === "bool") {
        // bool option so make sure other option is in option.values[]
        otherOptionValue = (item.value !== "true").toString();
      } else if (o.sub_type === "menu" && o.choices.length === 2) {
        // two-choice option, so make sure other option is in option.values[]
        otherOptionValue = o.choices.filter((c) => c.name !== item.value)[0]
          .name;
      } else {
        if (o.values.length === 1) {
          // only one option, so can't move this to another value
          // pop up a notice to tell user to add more option values?
          console.log("only one option value, so cannot add");
          return;
        }
      }
      // console.log('otherOptionValue', otherOptionValue);
      const otherOption = find(o.values, (ov) => ov.value === otherOptionValue);
      // console.log('otherOption', otherOption);
      if (!otherOption) {
        const holes = [];
        holes.push(hole);
        o.values.push({
          __typename: "OptionValue",
          value: otherOptionValue,
          holes,
        });
      } else {
        otherOption.holes.push(hole);
      }
    }

    // console.log('o.values 2', o.values);
    setOption(o);
  };

  const getOptionValueDisplay = (value) => {
    if (option.sub_type === "bool") {
      return value === "true" ? "Yes" : "No";
    }
    if (option.sub_type === "menu") {
      return find(option.choices, (c) => c.name === value).disp;
    }
    return value;
  };

  const renderCustomOption = ({ item }) => {
    const onChange = ({ hole, newValue, newHoles }) => {
      setHoles({ item, hole, newValue, newHoles });
    };

    const disp = getOptionValueDisplay(item.value);
    return (
      <View style={styles.optionContainer}>
        <View style={styles.valueContainer}>
          <Text style={styles.label}>Value:</Text>
          <Text style={styles.value}>{disp}</Text>
          <Text style={styles.label}>Holes:</Text>
        </View>
        <HoleChooser
          holes={item.holes || game.holes.map((h) => h.hole)}
          onChange={onChange}
          title=""
          active={true}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GameNav title="Customize Options" showBack={true} backTo={"GameSetup"} />
      <View style={styles.title}>
        <Text>Option:</Text>
        <Text style={styles.name}>{option.disp}</Text>
      </View>
      <FlatList
        data={option.values}
        renderItem={renderCustomOption}
        keyExtractor={(o) => o.value}
        style={styles.optionList}
      />
      <OptionAddValue option={option} addOptionValue={addOptionValue} />
    </View>
  );
};

export default OptionsCustom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  label: {
    paddingRight: 10,
  },
  name: {
    fontWeight: "bold",
    paddingHorizontal: 10,
  },
  optionContainer: {
    paddingVertical: 10,
  },
  optionList: {
    flexGrow: 0,
    paddingBottom: 20,
  },
  title: {
    alignSelf: "center",
    flexDirection: "row",
    paddingVertical: 10,
  },
  value: {
    fontWeight: "bold",
    paddingRight: 10,
  },
  valueContainer: {
    flexDirection: "row",
  },
});
