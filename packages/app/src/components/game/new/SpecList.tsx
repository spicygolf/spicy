import { FlatList, View } from "react-native";
import type { ListOfGameSpecs } from "spicylib/schema";
import { SpecListItem } from "@/components/game/new/SpecListItem";

export function SpecList({
  specs,
}: {
  specs: ListOfGameSpecs | null | undefined;
}) {
  const loadedSpecs = specs?.$isLoaded ? specs.filter((s) => s?.$isLoaded) : [];

  return (
    <View>
      <FlatList
        data={loadedSpecs}
        renderItem={({ item }) => <SpecListItem spec={item} />}
        keyExtractor={(item) => item.$jazz.id}
      />
    </View>
  );
}
