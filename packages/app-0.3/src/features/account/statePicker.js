import { Dropdown } from 'react-native-element-dropdown';

const StatePicker = props => {
  const { states, selectedValue, onValueChange } = props;

  const items = states.map(state => ({
    label: state.name,
    value: state.name,
  }));

  const onChange = selection => {
    onValueChange(selection.value);
  };

  return (
    <Dropdown
      value={selectedValue}
      data={items}
      labelField="label"
      valueField="value"
      placeholder="Select a state/province"
      onChange={onChange}
    />
  );
};

export default StatePicker;
