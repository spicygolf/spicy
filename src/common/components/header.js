import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Header = (props) => {
  const { title, color } = props;
  const bg = { backgroundColor: color };

  return (
    <View style={[styles.header, bg]}>
      <Text style={styles.title} testID="title">
        {title}
      </Text>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
