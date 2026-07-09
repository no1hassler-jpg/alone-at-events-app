import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { MainTabs } from './src/navigation/MainTabs';
import { RootStackParamList } from './src/navigation/types';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';
import { ConversationScreen } from './src/screens/ConversationScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { EventDetailScreen } from './src/screens/EventDetailScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0D0D0D',
    card: '#0D0D0D',
    border: '#2A2A2A',
  },
};

function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#4ADE80" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: '#FFFFFF', headerStyle: { backgroundColor: '#0D0D0D' } }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={({ route }) => ({ title: route.params.event.venue })}
          />
          <Stack.Screen name="Conversation" component={ConversationScreen} />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ title: 'Profile' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
