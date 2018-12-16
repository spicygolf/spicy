import React from 'react';

import {
  ActivityIndicator,
  Text
} from 'react-native';



class PlayerItem extends React.Component {

  render() {
    console.log(this.props.item);
    return (<Text>{this.props.item.name}</Text>);
  }
}


export default PlayerItem;
