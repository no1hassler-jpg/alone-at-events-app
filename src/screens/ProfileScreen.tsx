import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProfileDisplay } from '../components/ProfileDisplay';
import { useAuth } from '../contexts/AuthContext';
import { usePublicProfile } from '../hooks/useUserProfile';
import { RootStackParamList } from '../navigation/types';

export function ProfileScreen() {
  const { user, logOut } = useAuth();
  const { profile, loading } = usePublicProfile(user?.uid);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (loading || !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#4ADE80" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProfileDisplay profile={profile} />

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.buttonText}>EDIT PROFILE</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.button, styles.signOutButton, pressed && styles.buttonPressed]}
        onPress={() => logOut()}
      >
        <Text style={[styles.buttonText, styles.signOutText]}>SIGN OUT</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#4ADE80',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#0D0D0D',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signOutButton: {
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
    marginTop: 12,
  },
  signOutText: {
    color: '#FF5C5C',
  },
});
