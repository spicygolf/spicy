import { FlatList, View } from "react-native";
import type { ListOfGameSpecs } from "spicylib/schema";
import { SpecListItem } from "@/components/game/new/SpecListItem";

export function SpecList({
  specs,
}: {
  specs: ListOfGameSpecs | null | undefined;
}) {
  return (
    <View>
      <FlatList
        data={specs}
        renderItem={({ item }) => <SpecListItem spec={item} />}
        keyExtractor={(item, index) => item?.id ?? index.toString()}
      />
    </View>
  );
}
