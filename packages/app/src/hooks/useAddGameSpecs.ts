import { useAccount } from "jazz-tools/react-native";
import { GameSpec, PlayerAccount } from "spicylib/schema";

export function useAddGameSpecs() {
  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        specs: { $each: true },
      },
    },
  });

  const addGameSpecs = async () => {
    if (!me?.$isLoaded || !me.root?.$isLoaded || !me.root.specs?.$isLoaded) {
      return;
    }

    const specs = me.root.specs;

    // Add multiple specs
    const specsToAdd = [
      {
        name: "Match Play",
        short:
          "Hole by hole scoring with lower (net if enabled) scores winning holes",
        long_description:
          "### Match Play\n\nClassic match play format:\n* Win, lose, or tie each hole\n* Lower score (gross or net) wins the hole\n* Most holes won wins the match\n* Can play singles or team format",
      },
      {
        name: "Nassau",
        short: "Three separate bets: front 9, back 9, and overall 18",
        long_description:
          "### Nassau\n\nThe classic three-way bet:\n* Front 9 winner\n* Back 9 winner\n* Overall 18 winner\n* Each segment is a separate bet\n* Can be played with automatic presses",
      },
      {
        name: "Wolf",
        short:
          "Rotating captain chooses partner or plays alone for double points",
        long_description:
          "### Wolf\n\nStrategic team game:\n* Rotating wolf (captain) each hole\n* Wolf chooses partner after tee shots\n* Or goes lone wolf for double points\n* Points based on team wins",
      },
      {
        name: "Stableford",
        short: "Point-based scoring system rewarding aggressive play",
        long_description:
          "### Stableford\n\nPoint scoring system:\n* Eagle: 4 points\n* Birdie: 3 points\n* Par: 2 points\n* Bogey: 1 point\n* Double bogey+: 0 points\n* Highest total points wins",
      },
      {
        name: "Best Ball",
        short: "Team format using the best score among partners",
        long_description:
          "### Best Ball\n\nTeam competition:\n* Each player plays their own ball\n* Team uses best score on each hole\n* Can be 2-person or 4-person teams\n* Great for mixed skill levels",
      },
    ];

    const specsToCreate = specsToAdd.filter(
      (specData) =>
        !specs.some(
          (s: (typeof specs)[number]) =>
            s?.$isLoaded && s.name === specData.name,
        ),
    );

    if (specsToCreate.length === 0) {
      return;
    }

    const specsListOwner = specs.$jazz.owner;
    if (!specsListOwner) {
      return;
    }

    for (const specData of specsToCreate) {
      const newSpec = GameSpec.create(
        {
          ...specData,
          version: 1,
          status: "prod",
          spec_type: "points",
          min_players: 2,
          location_type: "local",
          teams: specData.name === "Best Ball" || specData.name === "Wolf",
        },
        { owner: specsListOwner },
      );

      specs.$jazz.push(newSpec);
    }
  };

  return { addGameSpecs };
}
