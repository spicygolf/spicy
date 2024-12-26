import {Text, TouchableOpacity, View} from 'react-native';
import {GameSpec} from 'schema/gamespecs';
import {Link} from 'expo-router';

function SpecListItem({spec}: {spec: GameSpec}) {
  if (!spec) return null;
  return (
    <View className="flex flex-row">
      {/* <Link
        href={{
          pathname: "/games/[game]/settings",
          params: { game: game.id },
        }}
      > */}
      <View className="flex-10 flex-col my-2">
        <Text role="heading" className="text-lg text-dark dark:text-white">
          {spec.name}
        </Text>
        <Text className="max-w-[700px] text-xs text-gray-500 md:text-xl dark:text-gray-400">
          {spec.type} - {spec.short}
        </Text>
      </View>
      {/* </Link> */}
    </View>
  );
}

export default SpecListItem;
