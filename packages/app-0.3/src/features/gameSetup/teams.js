import { useMutation } from "@apollo/client";
import { blue } from "common/colors";
import TeamChooser from "common/components/teamChooser";
import WolfOrderChooser from "common/components/wolfOrderChooser";
import {
  getGamespecKVs,
  omitTypename,
  teamsRotateOptions,
} from "common/utils/game";
import { GameContext } from "features/game/gameContext";
import { UPDATE_GAME_SCOPE_MUTATION } from "features/game/graphql";
import { cloneDeep, findIndex } from "lodash";
import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ButtonGroup, Card } from "react-native-elements";

const Teams = (_props) => {
  const { game, activeGameSpec, readonly } = useContext(GameContext);
  //console.log('gameSetup activeGameSpec', activeGameSpec);

  const [updateGameScope] = useMutation(UPDATE_GAME_SCOPE_MUTATION);

  const teamsFromGamespecs = getGamespecKVs(game, "teams");
  if (!teamsFromGamespecs.includes(true)) {
    return null;
  }

  const updateRotation = async (selectedIndex) => {
    if (!game || !game.scope || readonly) {
      return;
    }

    //console.log('selectedIndex', teamsRotateOptions[selectedIndex].slug);
    const newScope = cloneDeep(game.scope);
    newScope.teams_rotate = teamsRotateOptions[selectedIndex].slug;
    const newScopeWithoutTypes = omitTypename(newScope);

    const { error } = await updateGameScope({
      variables: {
        gkey: game._key,
        scope: newScopeWithoutTypes,
      },
      optimisticResponse: {
        __typename: "Mutation",
        updateGameScope: {
          __typename: "Game",
          _key: game._key,
          scope: newScope,
        },
      },
    });

    if (error) {
      // TODO: error component
      console.log("Error updating game scope - gameSetup teams", error);
    }
  };

  let selected = -1;
  if (game?.scope?.teams_rotate) {
    selected = findIndex(teamsRotateOptions, { slug: game.scope.teams_rotate });
  }

  const buttons = teamsRotateOptions.map((o) => o.caption);

  let title = "Teams";
  let chooserContent = null;
  let buttonsContent = null;

  if (game?.scope?.teams_rotate) {
    if (game.scope.teams_rotate === "never") {
      chooserContent = (
        <View style={styles.chooserView}>
          <Text>Choose Teams:</Text>
          <TeamChooser currentHole="1" from="game_setup" />
        </View>
      );
    }
    if (
      game.scope.teams_rotate === "every1" &&
      activeGameSpec.team_determination === "wolf"
    ) {
      const wolf_name = activeGameSpec.wolf_disp
        ? activeGameSpec.wolf_disp
        : "Wolf";
      title = `${wolf_name} Order`;
      chooserContent = <WolfOrderChooser />;
    }
  }

  if (activeGameSpec.team_determination !== "wolf") {
    buttonsContent = (
      <View>
        <Text>Teams Rotate:</Text>
        <ButtonGroup
          buttons={buttons}
          selectedIndex={selected}
          onPress={updateRotation}
          textStyle={styles.textStyle}
          selectedButtonStyle={styles.selectedButton}
          selectedTextStyle={styles.selectedText}
        />
      </View>
    );
  }

  return (
    <View testID="game_setup_teams_card">
      <Card>
        <Card.Title>{title}</Card.Title>
        <Card.Divider />
        {buttonsContent}
        {chooserContent}
      </Card>
    </View>
  );
};

export default Teams;

const styles = StyleSheet.create({
  buttonView: {
    alignItems: "center",
  },
  chooserView: {
    paddingTop: 20,
  },
  selectedButton: {
    backgroundColor: blue,
  },
  selectedText: {
    color: "white",
  },
  textStyle: {
    alignItems: "center",
    flexWrap: "wrap",
  },
});
