import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import colors from '@/utils/colors';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDarkMode ? colors.white : colors.black,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: isDarkMode ? colors.black : colors.white,
          borderTopWidth: 0,
        },
      }}
      initialRouteName="games"
    >
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="pencil-square-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
