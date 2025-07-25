import { useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { green } from 'common/colors';
import { validateFloat, validateName } from 'common/utils/account';
import { GameContext } from 'features/game/gameContext';
import { query as getGameQuery } from 'features/game/hooks/useGetGameQuery';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { ADD_PLAYER_MUTATION } from 'features/players/graphql';
import moment from 'moment';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card } from 'react-native-elements';

const AddPlayerManual = (props) => {
  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const { currentPlayer } = useContext(CurrentPlayerContext);
  const [addPlayer] = useMutation(ADD_PLAYER_MUTATION);
  const navigation = useNavigation();

  const [player, setPlayer] = useState({
    name: '',
    short: '',
    handicap: {
      source: 'manual',
      index: '',
    },
    statusAuthz: ['prod'],
    createdBy: currentPlayer._key,
    createdDate: '',
  });

  const add = async () => {
    player.createdDate = moment.utc().format();

    const { error, data } = await addPlayer({
      variables: {
        player: player,
      },
      refetchQueries: [
        {
          query: getGameQuery,
          variables: {
            gkey: gkey,
          },
        },
      ],
    });
    if (error) {
      console.log('Error adding player', error);
    }
    //console.log('data', data);
    if (data && data.addPlayer) {
      const p = {
        _key: data.addPlayer._key,
        name: player.name,
        handicap: player.handicap,
      };
      navigation.navigate('LinkRoundList', {
        game,
        player: p,
        round: null,
      });
    }
  };

  const validate = useCallback(
    (type, text) => {
      const nTest = type === 'name' ? text : player.name;
      const sTest = type === 'short' ? text : player.short;
      const hTest = type === 'index' ? text : player.handicap?.index;
      setNameValid(validateName(nTest));
      setShortValid(validateName(sTest));
      setHIValid(validateFloat(hTest));
    },
    [player],
  );

  const [nameValid, setNameValid] = useState(false);
  const nValid = { borderColor: nameValid ? green : '#ddd' };

  const [shortValid, setShortValid] = useState(false);
  const sValid = { borderColor: shortValid ? green : '#ddd' };

  const [hiValid, setHIValid] = useState(false);
  const hValid = { borderColor: hiValid ? green : '#ddd' };

  useEffect(() => validate(), [validate]);

  return (
    <Card>
      <View>
        <View style={styles.field_container}>
          <Text style={styles.field_label}>Full Name *</Text>
          <TextInput
            style={[styles.field_input, nValid]}
            onChangeText={(text) => {
              setPlayer({
                ...player,
                name: text,
              });
              validate('name', text);
            }}
            autoCapitalize="words"
            value={player.name}
          />
        </View>
        <View style={styles.field_container}>
          <Text style={styles.field_label}>Short/Nickname *</Text>
          <TextInput
            style={[styles.field_input, sValid]}
            onChangeText={(text) => {
              setPlayer({
                ...player,
                short: text,
              });
              validate('short', text);
            }}
            autoCapitalize="words"
            value={player.short}
          />
        </View>
        <View style={styles.handicap_field_container}>
          <Text style={styles.field_label}>Handicap Index</Text>
          <View style={styles.handicap_field_input_view}>
            <TextInput
              style={[styles.field_input, styles.handicap_field_input, hValid]}
              onChangeText={(text) => {
                setPlayer({
                  ...player,
                  handicap: {
                    source: 'manual',
                    index: text,
                  },
                });
                validate('index', text);
              }}
              keyboardType="decimal-pad"
              value={player.handicap?.index.toString()}
            />
          </View>
        </View>
        <Button
          style={styles.add}
          title="Add"
          type={nameValid && shortValid && hiValid ? 'solid' : 'outline'}
          disabled={!(nameValid && shortValid && hiValid)}
          onPress={add}
          accessibilityLabel="AddPlayerManual"
          testID="add_player_manual_button"
        />
      </View>
    </Card>
  );
};

export default AddPlayerManual;

const styles = StyleSheet.create({
  add: {
    marginTop: 30,
  },
  field_input: {
    borderColor: '#ccc',
    borderWidth: 1,
    color: '#000',
    height: 40,
    marginBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  field_input_view: {
    flex: 1,
    justifyContent: 'center',
  },
  field_label: {
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 5,
  },
  handicap_field_container: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  handicap_field_input: {
    alignItems: 'center',
    marginLeft: 20,
    width: 70,
  },
});
