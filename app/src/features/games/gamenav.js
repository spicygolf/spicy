import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GameNav = (props) => {
  const { backTo, showBack, showScore, game, scores, title } = props;
  const navigation = useNavigation();

  const back = backTo ? () => navigation.navigate(backTo) : () => navigation.goBack();

  const left = showBack ? (
    <TouchableOpacity onPress={() => back()}>
      <Icon name="chevron-left" size={30} color="#bbb" />
    </TouchableOpacity>
  ) : (
    <Text />
  );

  const right = showScore ? (
    <TouchableOpacity onPress={() => navigation.navigate('Score', { game, scores })}>
      <Icon name="lead-pencil" size={30} color="#666" />
    </TouchableOpacity>
  ) : (
    <Text />
  );

  return (
    <View style={styles.container}>
      <View style={styles.GameNav}>
        <View style={styles.left}>{left}</View>
        <View style={styles.middle}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
};

export default GameNav;

const styles = StyleSheet.create({
  GameNav: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  container: {},
  left: {
    flex: 1,
    justifyContent: 'center',
  },
  middle: {
    flex: 5,
    justifyContent: 'center',
  },
  right: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
  },
});
