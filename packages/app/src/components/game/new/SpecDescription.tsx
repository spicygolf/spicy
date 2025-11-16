import { useRef, useState } from "react";
import { Animated, FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameSpec, ListOfGameSpecs } from "spicylib/schema";
import { SpecCard } from "./SpecCard";

interface SpecDescriptionProps {
  specs: ListOfGameSpecs | null | undefined;
  favoriteSpecIds?: Set<string>;
  onToggleFavorite?: (spec: GameSpec) => void;
}

export function SpecDescription({
  specs,
  favoriteSpecIds,
  onToggleFavorite,
}: SpecDescriptionProps) {
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const pan = useRef(new Animated.Value(0)).current;
  const loadedSpecs = specs?.$isLoaded ? specs.filter((s) => s?.$isLoaded) : [];

  const boxWidth = scrollViewWidth * 0.8;
  const boxDistance = scrollViewWidth - boxWidth;
  const halfBoxDistance = boxDistance / 2;

  return (
    <View style={styles.container}>
      <FlatList
        data={loadedSpecs}
        renderItem={({ item, index }) => (
          <SpecCard
            spec={item}
            index={index}
            pan={pan}
            boxWidth={boxWidth}
            halfBoxDistance={halfBoxDistance}
            isFavorited={favoriteSpecIds?.has(item.$jazz.id)}
            onToggleFavorite={onToggleFavorite}
          />
        )}
        keyExtractor={(item) => item.$jazz.id}
        horizontal
        contentInsetAdjustmentBehavior="never"
        snapToInterval={boxWidth}
        snapToAlignment="center"
        decelerationRate="fast"
        automaticallyAdjustContentInsets={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={1}
        contentInset={{
          left: halfBoxDistance,
          right: halfBoxDistance,
        }}
        contentOffset={{ x: halfBoxDistance * -1, y: 0 }}
        onLayout={(e) => {
          setScrollViewWidth(e.nativeEvent.layout.width);
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: pan } } }],
          {
            useNativeDriver: false,
          },
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
