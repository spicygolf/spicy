import {FlatList, View} from 'react-native';
import SpecListItem from 'components/game/new/SpecListItem';
import {ListOfGameSpecs} from 'schema/gamespecs';

function SpecList({specs}: {specs: ListOfGameSpecs}) {
  return (
    <View className="flex">
      <FlatList
        data={specs}
        renderItem={({item}) => <SpecListItem spec={item!} />}
        keyExtractor={item => item!.id}
      />
    </View>
  );
}

export default SpecList;
