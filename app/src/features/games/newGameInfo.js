import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import GameNav from 'features/games/gamenav';
import moment from 'moment';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-elements';

const NewGameInfo = (props) => {
  const { route } = props;
  const { gamespec } = route.params;

  const navigation = useNavigation();

  const [start, setStart] = useState(new Date());
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    const newStart = selectedDate || start;
    setShow(Platform.OS === 'ios');
    setStart(newStart);
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode('date');
  };

  const showTimepicker = () => {
    showMode('time');
  };

  return (
    <View>
      <GameNav title="Game Information" showBack={true} />
      <Card>
        <View>
          <View style={styles.name}>
            <Text style={styles.label_txt}>Game:</Text>
            <Text>{gamespec.disp}</Text>
          </View>
        </View>
        <View style={styles.date_time_view}>
          <View style={styles.date_view}>
            <Text style={styles.label_txt}>Date:</Text>
            <Text style={styles.value_txt} onPress={showDatepicker}>
              {moment(start).format('ll')}
            </Text>
          </View>
          <View style={styles.time_view}>
            <Text style={styles.label_txt}>Time:</Text>
            <Text style={styles.value_txt} onPress={showTimepicker}>
              {moment(start).format('LT')}
            </Text>
          </View>
        </View>
        <View>
          <Text style={styles.note}>
            Recommended: match game date/time with your tee time.
          </Text>
          {show && (
            <DateTimePicker
              testID="game_start_datetimepicker"
              value={start}
              mode={mode}
              is24Hour={false}
              display="default"
              onChange={onChange}
            />
          )}
        </View>
      </Card>
      <Button
        buttonStyle={styles.button}
        title="Create Game"
        type="solid"
        onPress={() => {
          navigation.navigate('NewGame', {
            gamespec: gamespec,
            game_start: moment.utc(start).format(),
          });
        }}
        accessibilityLabel="Create Game"
        testID="create_game"
      />
    </View>
  );
};

export default NewGameInfo;

const styles = StyleSheet.create({
  button: {
    margin: 15,
  },
  date_time_view: {
    flexDirection: 'row',
  },
  date_view: {
    flex: 1,
  },
  label_txt: {
    color: '#555',
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  name: {
    paddingBottom: 20,
  },
  note: {
    fontSize: 10,
    paddingVertical: 10,
    textAlign: 'center',
  },
  time_view: {
    flex: 1,
  },
  value_txt: {
    borderColor: '#ddd',
    borderWidth: 1,
    marginRight: 10,
    padding: 10,
    textAlign: 'center',
  },
});
