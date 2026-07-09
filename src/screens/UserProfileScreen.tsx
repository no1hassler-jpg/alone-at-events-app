import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProfileDisplay } from '../components/ProfileDisplay';
import { ReportBlockActions } from '../components/ReportBlockActions';
import { useAuth } from '../contexts/AuthContext';
import { usePublicProfile } from '../hooks/useUserProfile';
import { RootStackParamList } from '../navigation/types';
import { getOrCreateChat } from '../services/chatService';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { user } = useAuth();
  const { profile: myProfile } = usePublicProfile(user?.uid);
  const { profile, loading } = usePublicProfile(userId);
  const [startingChat, setStartingChat] = useState(false);

  if (loading || !profile || !myProfile || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#4ADE80" />
      </View>
    );
  }

  async function handleMessage() {
    setStartingChat(true);
    try {
      const chatId = await getOrCreateChat(
        { uid: user!.uid, name: myProfile!.name },
        { uid: userId, name: profile!.name }
      );
      navigation.navigate('Conversation', { chatId, otherUserId: userId, otherUserName: profile!.name });
    } catch {
      Alert.alert("Couldn't start chat", 'Please try again.');
    } finally {
      setStartingChat(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProfileDisplay profile={profile} />

      <Pressable
        style={({ pressed }) => [styles.messageButton, pressed && styles.buttonPressed]}
        onPress={handleMessage}
        disabled={startingChat}
      >
        {startingChat ? (
          <ActivityIndicator color="#0D0D0D" />
        ) : (
          <Text style={styles.messageButtonText}>MESSAGE</Text>
        )}
      </Pressable>

      <View style={styles.spacer} />

      <ReportBlockActions
        currentUid={user.uid}
        targetUid={userId}
        targetName={profile.name}
        context="profile"
        onBlocked={() => navigation.goBack()}
      />
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
  messageButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  messageButtonText: {
    color: '#0D0D0D',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  spacer: {
    height: 12,
  },
});
