import { useMutation } from "@apollo/client";
import { green } from "common/colors";
import HoleChooser from "common/components/holeChooser";
import {
  getHolesToUpdate,
  omitTypename,
  teamsRotateOptions,
} from "common/utils/game";
import { setGameMeta } from "common/utils/metadata";
import { GameContext } from "features/game/gameContext";
import { UPDATE_GAME_HOLES_MUTATION } from "features/game/graphql";
import { find } from "lodash";
import { useContext, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Button, Icon, ListItem } from "react-native-elements";

const ChangeTeams = ({ currentHole, close }) => {
  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const [selected, setSelected] = useState("0");
  const [holes, setHoles] = useState([]);

  const [updateGameHoles] = useMutation(UPDATE_GAME_HOLES_MUTATION);

  const choices = [
    { key: "0", name: "gameSetup", disp: "Game Setup" },
    { key: "1", name: "currentHole", disp: "Current Hole" },
    { key: "2", name: "custom", disp: "Custom" },
  ];

  const teams_rotate = find(teamsRotateOptions, {
    slug: game.scope.teams_rotate,
  });
  const teams_rotate_caption = teams_rotate?.caption
    ? teams_rotate.caption
    : "";

  const renderChoice = ({ item }) => {
    let title = item.disp;
    switch (item.name) {
      case "gameSetup":
        title = `${item.disp}: ${teams_rotate_caption}`;
        break;
      case "currentHole":
        title = `${item.disp}: ${currentHole}`;
        break;
      default:
        break;
    }
    const leftAvatarColor = item.key === selected ? green : "transparent";

    return (
      <ListItem onPress={() => setSelected(item.key)}>
        <Icon
          name="check-circle"
          type="material-community"
          color={leftAvatarColor}
          size={30}
        />
        <ListItem.Content>
          <ListItem.Title>{title}</ListItem.Title>
        </ListItem.Content>
      </ListItem>
    );
  };

  const renderSeparator = () => {
    return <View style={styles.separator} />;
  };

  const changeTeamsOnHoles = async () => {
    const newHoles = game.holes.map((h) => {
      if (holes.includes(h.hole)) {
        return {
          ...h,
          teams: [],
          multipliers: [],
        };
      } else {
        return h;
      }
    });
    const newHolesWithoutTypes = omitTypename(newHoles);

    const { error } = await updateGameHoles({
      variables: {
        gkey: gkey,
        holes: newHolesWithoutTypes,
      },
      optimisticResponse: {
        __typename: "Mutation",
        updateGameHoles: {
          __typename: "Game",
          _key: gkey,
          holes: newHoles,
        },
      },
    });

    if (error) {
      console.log("Error updating game - changeTeams", error);
    } else {
      setGameMeta(gkey, "holesToUpdate", holes);
    }
  };

  const onCustomChange = ({ newHoles }) => {
    setHoles(newHoles);
  };

  useEffect(() => {
    switch (selected) {
      case "0": // gameSetup
        setHoles(getHolesToUpdate(game.scope.teams_rotate, game, currentHole));
        break;
      case "1": // current hole
        setHoles([currentHole]);
        break;
      case "2": // custom
        // just leave what's already set for custom
        break;
      default:
        break;
    }
  }, [currentHole, game, selected]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Teams</Text>
      <Text style={styles.description}>
        Change players on teams according to:
      </Text>
      <View style={styles.choicesList}>
        <FlatList
          data={choices}
          renderItem={renderChoice}
          ItemSeparatorComponent={renderSeparator}
        />
      </View>
      <HoleChooser
        holes={holes}
        onChange={onCustomChange}
        title="Preview:"
        active={selected === "2"}
      />
      <View style={styles.button_row}>
        <Button
          buttonStyle={styles.prev}
          title="Cancel"
          type="outline"
          onPress={close}
          accessibilityLabel="Cancel Change Teams"
          testID="cancel_change_teams_button"
        />
        <Button
          buttonStyle={styles.next}
          title="Change"
          type="solid"
          onPress={async () => {
            await changeTeamsOnHoles();
            close();
          }}
          accessibilityLabel="Change Teams"
          testID="change_teams_button"
        />
      </View>
    </View>
  );
};

export default ChangeTeams;

const styles = StyleSheet.create({
  button_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 40,
  },
  choicesList: {},
  container: {
    flex: 0.6,
    padding: 20,
  },
  description: {
    paddingVertical: 10,
  },
  next: {
    paddingLeft: 10,
    width: 120,
  },
  prev: {
    paddingRight: 10,
    width: 120,
  },
  previewView: {
    paddingVertical: 10,
  },
  separator: {
    backgroundColor: "#ddd",
    height: 1,
    width: "100%",
  },
  title: {
    alignSelf: "center",
    fontSize: 18,
    fontWeight: "bold",
    paddingBottom: 10,
  },
});
