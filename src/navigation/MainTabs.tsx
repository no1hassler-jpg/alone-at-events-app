import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { ChatListScreen } from '../screens/ChatListScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ fontSize: 18, color }}>{symbol}</Text>;
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0D0D0D', borderTopColor: '#2A2A2A' },
        tabBarActiveTintColor: '#4ADE80',
        tabBarInactiveTintColor: '#8A8A8A',
      }}
    >
      <Tab.Screen
        name="EventsTab"
        component={HomeScreen}
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <TabIcon symbol="●" color={color} />,
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatListScreen}
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <TabIcon symbol="◆" color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon symbol="▲" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
