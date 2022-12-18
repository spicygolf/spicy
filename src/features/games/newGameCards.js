import { useNavigation } from '@react-navigation/native';
import { GameListContext } from 'features/games/gameListContext';
import React, { useContext, useRef, useState } from 'react';
import { Animated, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-elements';
import Markdown from 'react-native-markdown-display';

const NewGameCards = () => {
  const navigation = useNavigation();
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const { gameList } = useContext(GameListContext);
  if (!gameList) {
    return null;
  }
  const { gamespecs, total } = gameList;

  const boxWidth = scrollViewWidth * 0.8;
  const boxDistance = scrollViewWidth - boxWidth;
  const halfBoxDistance = boxDistance / 2;

  const gamespecPressed = async (gamespec) => {
    navigation.navigate('NewGameInfo', {
      gamespec,
    });
  };

  // `item` is a gamespec
  const renderItem = ({ item, index }) => {
    const { gamespec, player_count } = item;
    let pct = total === 0 ? '' : Math.round((100 * player_count) / total);
    let cnt = total === 0 ? '' : player_count;
    return (
      <Animated.View
        style={{
          transform: [
            {
              scale: pan.x.interpolate({
                inputRange: [
                  (index - 1) * boxWidth - halfBoxDistance,
                  index * boxWidth - halfBoxDistance,
                  (index + 1) * boxWidth - halfBoxDistance, // adjust positioning
                ],
                outputRange: [0.8, 1, 0.8], // scale down when out of scope
                extrapolate: 'clamp',
              }),
            },
          ],
        }}
      >
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            height: '98%',
            padding: 10,
            marginVertical: 5,
            width: boxWidth,
            borderWidth: 2,
            borderColor: '#ddd',
            backgroundColor: 'white',
          }}
        >
          <View style={styles.container}>
            <View style={styles.titleView}>
              <Text style={styles.title}>{gamespec.disp || ''}</Text>
            </View>
            <View style={styles.subtitleRow}>
              <Text style={styles.type}>type: {gamespec.type || ''}</Text>
              <Text style={styles.subtitle}>
                you: {pct}% of games ({cnt} total)
              </Text>
            </View>
            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              style={styles.scrollView}
            >
              <Markdown style={styles}>{gamespec.long_description || mq}</Markdown>
            </ScrollView>
            <Button
              title="Play Game"
              onPress={() => gamespecPressed(gamespec)}
              style={styles.playButton}
            />
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={gamespecs}
        renderItem={renderItem}
        keyExtractor={(item) => item.gamespec._key}
        horizontal
        contentInsetAdjustmentBehavior="never"
        snapToInterval={boxWidth}
        snapToAlignment="center"
        decelerationRate="fast"
        automaticallyAdjustContentInsets={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={1}
        contentInset={{
          left: halfBoxDistance,
          right: halfBoxDistance,
        }}
        contentOffset={{ x: halfBoxDistance * -1, y: 0 }}
        onLayout={(e) => {
          setScrollViewWidth(e.nativeEvent.layout.width);
        }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: pan.x } } }], {
          useNativeDriver: false,
        })}
      />
    </View>
  );
};

export default NewGameCards;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleView: {
    paddingBottom: 3,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtitleRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  type: {
    flex: 1,
    fontSize: 9,
    textAlign: 'left',
    color: '#333',
  },
  subtitle: {
    flex: 1,
    fontSize: 9,
    textAlign: 'right',
    color: '#333',
  },
  scrollView: {
    paddingVertical: 5,
  },
  playButton: {
    paddingTop: 5,
  },
  // Markdown Styles
  body: {
    fontSize: 12,
    paddingBottom: 10,
  },
  heading1: {
    fontSize: 18,
    paddingHorizontal: 3,
  },
  heading2: {
    fontSize: 16,
    paddingHorizontal: 3,
  },
  heading3: {
    fontSize: 14,
    paddingHorizontal: 3,
  },
  heading4: {
    fontSize: 12,
    paddingHorizontal: 3,
  },
  heading5: {
    fontSize: 11,
    paddingHorizontal: 3,
  },
  heading6: {
    fontSize: 10,
    paddingHorizontal: 3,
  },
  th: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tbody: {
    fontSize: 12,
  },
  td: {
    textAlign: 'center',
  },
});

const mq = `

`;
