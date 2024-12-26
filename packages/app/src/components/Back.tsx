import {Href, Link, router} from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {useColorScheme} from 'nativewind';
import colors from 'utils/colors';

type Props = {home: Href};

export default function Back({home}: Props) {
  const {colorScheme} = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const color = isDarkMode ? colors.white : colors.black;

  const replace = {replace: router.canGoBack()};
  return (
    <Link {...replace} href={home}>
      <FontAwesome name="chevron-left" size={20} color={color} />
    </Link>
  );
}
