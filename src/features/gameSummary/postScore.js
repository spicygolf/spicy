import React from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {
  Card,
} from 'react-native-elements';



const PostScore = props => {

  const { player } = props;

  return (
    <Card>
      <Text>{player.name}</Text>
    </Card>
  );
};

export default PostScore;


const styles = StyleSheet.create({

});
