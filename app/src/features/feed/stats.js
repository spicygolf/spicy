import { blue } from 'common/colors';
import { subDays, subMonths, subWeeks, subYears } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import Stat from 'features/feed/stat';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ButtonGroup } from 'react-native-elements';

const Stats = (props) => {
  const [timeFrame, setTimeFrame] = useState(1);

  const buttons = ['1d', '1w', '1m', 'ytd', '1y'];
  const now = new Date();
  const endDate = zonedTimeToUtc(now).toISOString();
  let begDate = '';
  switch (timeFrame) {
    case 0:
      begDate = subDays(now, 1).toISOString();
      break;
    case 1:
      begDate = subWeeks(now, 1).toISOString();
      break;
    case 2:
      begDate = subMonths(now, 1).toISOString();
      break;
    case 3:
      const y = now.getUTCFullYear();
      begDate = zonedTimeToUtc(new Date(y, 0, 1)).toISOString();
      break;
    case 4:
      begDate = subYears(now, 1).toISOString();
      break;
  }

  //console.log('dates', begDate, endDate);

  return (
    <View>
      <ButtonGroup
        buttons={buttons}
        selectedIndex={timeFrame}
        onPress={(index) => {
          setTimeFrame(index);
        }}
        containerStyle={styles.buttonGroupContainer}
        selectedButtonStyle={styles.selectedButton}
        textStyle={styles.buttonText}
        selectedTextStyle={styles.selectedButtonText}
      />
      <Text style={styles.title}>Games</Text>
      <View style={styles.row}>
        <Stat stat="public" begDate={begDate} endDate={endDate} side="left" />
        <Stat stat="myclubs" begDate={begDate} endDate={endDate} side="right" />
      </View>
      <View style={styles.row}>
        <Stat stat="faves" begDate={begDate} endDate={endDate} side="left" />
        <Stat stat="me" begDate={begDate} endDate={endDate} side="right" />
      </View>
    </View>
  );
};

export default Stats;

const styles = StyleSheet.create({
  buttonGroupContainer: {
    marginHorizontal: 15,
    marginTop: 15,
    maxHeight: 30,
  },
  selectedButton: {
    backgroundColor: blue,
  },
  buttonText: {
    fontSize: 14,
  },
  selectedButtonText: {
    color: 'white',
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
  },
});
