import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

import GameNav from 'features/games/gamenav';



const NewGameInfo = props => {

  const { route } = props;
  const { gamespec } = route.params;

  const navigation = useNavigation();

  const [start, setStart ] = useState(new Date());
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    const newStart = selectedDate || start;
    setShow(Platform.OS === 'ios');
    setStart(newStart);
  };

  const showMode = currentMode => {
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
      <GameNav
        title='Game Information'
        showBack={true}
      />
      <Card>
        <View>
          <View style={styles.name}>
            <Text style={styles.label_txt}>
              Game:
            </Text>
            <Text>
              {gamespec.disp}
            </Text>
          </View>
        </View>
        <View style={styles.date_time_view}>
          <View style={styles.date_view}>
            <Text style={styles.label_txt}>
              Date:
            </Text>
            <Text
              style={styles.value_txt}
              onPress={showDatepicker}
            >
              {moment(start).format('ll')}
            </Text>
          </View>
          <View style={styles.time_view}>
            <Text style={styles.label_txt}>
              Time:
            </Text>
            <Text
              style={styles.value_txt}
              onPress={showTimepicker}
            >
              {moment(start).format('LT')}
            </Text>
          </View>
        </View>
        <View>
          <Text style={styles.note}>
            Recommended: match game date/time with your tee time.
          </Text>
          { show && (
            <DateTimePicker
              testID='game_start_datetimepicker'
              value={start}
              mode={mode}
              is24Hour={false}
              display='default'
              onChange={onChange}
            />
          )}
        </View>
      </Card>
      <Button
        style={styles.button}
        title='Create Game'
        type='solid'
        onPress={() => {
          navigation.navigate('NewGame', {
            gamespec: gamespec,
            game_start: moment.utc(start).format(),
          })
        }}
        accessibilityLabel='Register Next 1'
        testID='register_next_1_button'
      />
    </View>
  );
};

export default NewGameInfo;


const styles = StyleSheet.create({
  name: {
    paddingBottom: 20,
  },
  date_time_view: {
    flexDirection: 'row',
  },
  date_view: {
    flex: 1,
  },
  time_view: {
    flex: 1,
  },
  label_txt: {
    fontWeight: 'bold',
    color: '#555',
    paddingVertical: 10,
  },
  value_txt: {
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    padding: 10,
    marginRight: 10,
  },
  note: {
    paddingVertical: 10,
    fontSize: 10,
    textAlign: 'center',
  },
  button: {
    margin: 15,
  },
});