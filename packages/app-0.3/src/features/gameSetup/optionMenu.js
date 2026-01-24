import { green } from "common/colors";
import { find } from "lodash";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "react-native-elements";
import SelectDropdown from "react-native-select-dropdown";

const OptionMenu = (props) => {
  const { option, setOption, readonly, index = 0 } = props;
  const [value, setValue] = useState(option.values[index].value);
  // console.log('OptionMenu index', index);

  const getChoices = () => option.choices.map((c) => c.disp);
  const getDisplay = () => find(option.choices, { name: value }).disp;

  const menuContent = readonly ? (
    <Text>{getDisplay()}</Text>
  ) : (
    <SelectDropdown
      data={getChoices()}
      defaultValueByIndex={index}
      onSelect={(_selectedDisp, i) => {
        setValue(option.choices[i].name);
        const newOption = {
          name: option.name,
          values: option.values.map((v, idx) => ({
            value: idx === i ? option.choices[i].name : v.value,
            holes: v.holes,
          })),
        };
        console.log("newOption", newOption);
        setOption(newOption);
      }}
      renderDropdownIcon={(isOpened) => {
        return (
          <Icon
            type="material-community"
            name={isOpened ? "chevron-up" : "chevron-down"}
            color="#444"
            size={18}
          />
        );
      }}
      buttonTextAfterSelection={(selectedItem) => {
        // text represented after item is selected
        // if data array is an array of objects then return selectedItem.property to render after item is selected
        // console.log('buttonTextAfterSelection', selectedItem);
        return selectedItem;
      }}
      rowTextForSelection={(item) => {
        // text represented for each item in dropdown
        // if data array is an array of objects then return item.property to represent item in dropdown
        console.log("rowTextForSelection", item);
        return item;
      }}
      buttonStyle={styles.buttonStyle}
    />
  );

  return <View style={styles.container}>{menuContent}</View>;
};

export default OptionMenu;

const styles = StyleSheet.create({
  buttonStyle: {
    alignSelf: "flex-end",
    backgroundColor: "#fff",
    borderColor: green,
    borderWidth: 1,
    height: 40,
    width: "80%",
  },
  container: {
    // width: '100%',
  },
});
