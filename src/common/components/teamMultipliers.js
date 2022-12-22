import { useMutation } from '@apollo/client';
import { red } from 'common/colors';
import {
  getAllOptions,
  getHolesToUpdate,
  omitTypename,
  teamsRotate,
} from 'common/utils/game';
import ScoringWrapper from 'common/utils/ScoringWrapper';
import { GameContext } from 'features/game/gameContext';
import { UPDATE_GAME_HOLES_MUTATION } from 'features/game/graphql';
import { cloneDeep, filter, find, findIndex, orderBy } from 'lodash';
import React, { useContext, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Input, Overlay } from 'react-native-elements';

const TeamMultipliers = (props) => {
  const { team: teamNum, scoring, currentHole } = props;
  const teamName = teamNum.toString();
  const [updateGameHoles] = useMutation(UPDATE_GAME_HOLES_MUTATION);
  const [activeOverlay, setActiveOverlay] = useState();
  const { game, readonly } = useContext(GameContext);
  const allmultipliers = getAllOptions({ game, type: 'multiplier' });

  const scoringWrapper = new ScoringWrapper(game, scoring, currentHole);

  const { _key: gkey } = game;
  const h = game?.holes
    ? find(game.holes, { hole: currentHole })
    : { hole: currentHole, teams: [] };

  const toggleOverlay = (multName) => {
    const key = `${teamName}|${multName}`;
    if (activeOverlay === key) {
      setActiveOverlay();
    } else {
      setActiveOverlay(key);
    }
  };

  const maybeSetMultiplier = (mult, newValue) => {
    if (mult.input_value === true && newValue === true) {
      // this is a multiplier that needs its input value set and it's going to "selected"
      // so show the overlay
      const key = `${teamName}|${mult.name}`;
      setActiveOverlay(key);
    } else {
      setMultiplier(mult, newValue);
    }
  };

  const setMultiplier = async (mult, newValue, customValue) => {
    if (readonly) {
      return;
    } // viewing game only, so do nothing
    // only set in DB if junk is based on user input
    if (mult.based_on !== 'user') {
      return;
    }
    // achieved so no press action
    if (mult.existing) {
      return;
    }

    if (!game || !game.holes) {
      return;
    }

    let holesToUpdate = getHolesToUpdate(mult.scope, game, currentHole);

    let newHoles = cloneDeep(game.holes);
    holesToUpdate.map((htu) => {
      const holeIndex = findIndex(newHoles, { hole: htu });
      if (holeIndex < 0) {
        console.log('setMultiplier hole does not exist');
      }
      //console.log('holeIndex', holeIndex);

      // if multipliers doesn't exist, create blank
      if (!newHoles[holeIndex].multipliers) {
        newHoles[holeIndex].multipliers = [];
      }
      const mults = newHoles[holeIndex].multipliers;
      let newMult = {
        __typename: 'Multiplier',
        name: mult.name,
        team: teamNum,
        first_hole: currentHole,
        value: null,
      };
      if (newValue && !find(mults, newMult)) {
        if (mult.input_value === true && customValue) {
          newMult.value = parseFloat(customValue);
        }
        mults.push(newMult);
      }
      if (!newValue && find(mults, { name: mult.name })) {
        const newMults = filter(
          mults,
          (m) =>
            !(m.name === mult.name && m.team === teamNum && m.first_hole === currentHole),
        );
        // console.log('newMults', newMults);
        newHoles[holeIndex].multipliers = newMults;
      }
    });
    const newHolesWithoutTypes = omitTypename(newHoles);

    const { error } = await updateGameHoles({
      variables: {
        gkey: gkey,
        holes: newHolesWithoutTypes,
      },
      optimisticResponse: {
        __typename: 'Mutation',
        updateGameHoles: {
          __typename: 'Game',
          _key: gkey,
          holes: newHoles,
        },
      },
    });

    if (error) {
      console.log('Error updating game - teamMultipliers', error);
    }
  };

  const CustomValueOverlay = ({ mult, selected }) => {
    const [customValue, setCustomValue] = useState();
    const [valid, setValid] = useState(true);
    const multName = mult.name;
    const key = `${teamName}|${multName}`;

    const validate = (n) => {
      try {
        if (!isNaN(parseFloat(n)) && isFinite(n)) {
          setValid(true);
        } else {
          setValid(false);
        }
      } catch (error) {
        setValid(false);
      }
    };

    let overrideTxt = null;
    if (mult.override === true) {
      overrideTxt = (
        <Text style={styles.overrideTxt}>
          Overrides all other multipliers. In effect this hole only.
        </Text>
      );
    }

    return (
      <Overlay
        isVisible={activeOverlay === key}
        onBackdropPress={() => toggleOverlay(multName)}
      >
        <View style={styles.field}>
          <Input
            label="Enter Custom Multiplier"
            labelStyle={styles.label}
            containerStyle={[styles.field_input, styles.last_name]}
            inputStyle={styles.field_input_txt}
            onChangeText={(text) => {
              setCustomValue((_) => text);
              validate(text);
            }}
            keyboardType="decimal-pad"
            value={customValue}
            errorMessage={valid ? '' : 'Please enter a valid number'}
          />
        </View>

        <View style={styles.button_row}>
          <Button
            title="Cancel"
            type="outline"
            onPress={() => toggleOverlay(multName)}
            buttonStyle={styles.no_button}
            containerStyle={styles.no_button_container}
          />
          <Button
            title="Set"
            disabled={!valid}
            buttonStyle={styles.yes_button}
            containerStyle={styles.yes_button_container}
            onPress={() => {
              setMultiplier(mult, !selected, customValue);
              toggleOverlay(multName);
            }}
            testID="multiplier_custom_value_overlay_yes"
          />
        </View>
        {overrideTxt}
      </Overlay>
    );
  };

  const selectedOverrideMults = () => {
    const overrideMults = filter(h?.multipliers, (m) => {
      const optionSpec = find(allmultipliers, { name: m.name });
      return optionSpec.override === true;
    });
    return overrideMults;
  };

  const renderMultiplier = (mult) => {
    // // if we have any override mults, don't show this multiplier unless it's an override
    const overrideMults = selectedOverrideMults();
    if (overrideMults.length > 0) {
      const overrideMult = overrideMults[0];
      if (mult.name !== overrideMult.name) {
        return null;
      }
    }

    // TODO: mult.name needs l10n, i18n - use mult.name as slug
    let type = 'outline';
    let color = red;
    let bgColor = null;

    let selected = false;
    let disabled = false;
    if (
      (h?.multipliers &&
        find(h.multipliers, {
          name: mult.name,
          team: teamNum,
          first_hole: currentHole,
        })) ||
      mult.existing ||
      mult.based_on !== 'user' // show selected, because this one was achieved
    ) {
      selected = true;
      type = 'solid';
      color = 'white';
      bgColor = red;
      if (mult.existing) {
        disabled = true;
      }
    }

    let overlay = null;
    let title = mult.disp;
    if (mult.input_value === true) {
      overlay = (
        <CustomValueOverlay teamName={teamName} mult={mult} selected={selected} />
      );
      if (selected === true && mult.value) {
        title = `${mult.value}x`;
      }
    }

    return (
      <View>
        <Button
          title={title}
          icon={<Icon style={styles.icon} name={mult.icon} size={20} color={color} />}
          type={type}
          buttonStyle={[styles.button, { backgroundColor: bgColor }]}
          titleStyle={[styles.buttonTitle, { color: color }]}
          disabled={disabled}
          onPress={() => maybeSetMultiplier(mult, !selected)}
          onLongPress={() => maybeSetMultiplier(mult, !selected)}
        />
        {overlay}
      </View>
    );
  };

  const hole = find(scoring.holes, { hole: currentHole });
  if (!hole) {
    return null;
  }

  const team = find(hole.teams, { team: teamNum });
  if (!team) {
    return null;
  }

  const team_mults = [];
  // see if we have any mults already working from previous holes
  if (h && h.multipliers) {
    h.multipliers.map((hMult) => {
      if (hMult.first_hole !== currentHole && hMult.team === teamNum) {
        const existingMult = find(allmultipliers, { name: hMult.name });
        team_mults.push({
          ...existingMult,
          existing: true,
        });
      }
    });
  }

  // add in the user mults for this particular hole
  allmultipliers.map((gsMult) => {
    // if teams are rotating, and junk depends on team position, return
    // we don't want to offer junk in this situation
    if (teamsRotate(game)) {
      if (gsMult.availability.includes('team_down_the_most')) {
        return;
      }
      if (gsMult.availability.includes('team_second_to_last')) {
        return;
      }
      if (gsMult.availability.includes('rankWithTies')) {
        return;
      }
    }

    // only give options for multipliers based_on == 'user' or if they were
    // achieved via scoring or logic
    if (gsMult.based_on !== 'user') {
      hole.multipliers.map((hMult) => {
        if (hMult.name === gsMult.name && hMult.team === teamNum) {
          team_mults.push(gsMult);
        }
      });
      return;
    }

    try {
      if (scoringWrapper.logic(gsMult.availability, { team: team })) {
        if (gsMult.name === 'custom') {
          const gMult = find(h.multipliers, { name: 'custom' });
          gsMult.value = gMult?.value;
        }
        team_mults.push(gsMult);
      }
    } catch (e) {
      console.log('logic error', e);
    }
  });
  //console.log('team mults', teamNum, team_mults);
  const sorted_mults = orderBy(team_mults, ['seq'], ['asc']);
  //console.log('sorted_mults', sorted_mults);
  if (sorted_mults.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        horizontal={true}
        data={sorted_mults}
        renderItem={({ item }) => renderMultiplier(item)}
        keyExtractor={(_) => Math.random().toString()}
      />
    </View>
  );
};

export default TeamMultipliers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 5,
    paddingBottom: 5,
    paddingHorizontal: 5,
  },
  icon: {
    padding: 5,
  },
  button: {
    padding: 2,
    marginLeft: 5,
    borderColor: red,
  },
  buttonTitle: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 10,
    fontSize: 13,
  },
  field: {
    minWidth: '70%',
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'normal',
  },
  field_input: {
    color: '#000',
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  field_input_txt: {
    fontSize: 16,
  },
  button_row: {
    flexDirection: 'row',
  },
  no_button_container: {
    flex: 1,
    paddingRight: 10,
  },
  yes_button_container: {
    flex: 1,
    paddingLeft: 10,
  },
  overrideTxt: {
    fontSize: 9,
    color: '#999',
    paddingTop: 10,
    textAlign: 'center',
  },
});
