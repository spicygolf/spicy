import { Dropdown } from "react-native-element-dropdown";

const CountryPicker = (props) => {
  const { countries, selectedValue, onValueChange } = props;

  const items = countries.map((country) => ({
    label: country.name,
    value: country.code,
  }));

  const onChange = (selection) => {
    onValueChange(selection.value);
  };

  return (
    <Dropdown
      value={selectedValue}
      data={items}
      labelField="label"
      valueField="value"
      onChange={onChange}
    />
  );
};

export default CountryPicker;
