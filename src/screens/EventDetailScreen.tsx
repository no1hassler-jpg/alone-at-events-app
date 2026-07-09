import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { usePrivateProfile } from '../hooks/useUserProfile';
import { RootStackParamList } from '../navigation/types';
import { confirmEventInterest } from '../services/userService';
import { formatEventDate } from '../utils/formatDate';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;

export function EventDetailScreen({ route }: Props) {
  const { event } = route.params;
  const { weekday, day, month } = formatEventDate(event.date);
  const [goingSolo, setGoingSolo] = useState(false);
  const { user } = useAuth();
  const { profile } = usePrivateProfile(user?.uid);
  const [confirming, setConfirming] = useState(false);

  const interested = profile?.interestedEventIds.includes(event.id) ?? false;

  async function handleConfirmInterest() {
    if (!user) return;
    setConfirming(true);
    try {
      await confirmEventInterest(user.uid, event.id);
    } catch {
      Alert.alert("Couldn't confirm interest", 'Please try again.');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>
          {weekday} {day} {month}
        </Text>
        {event.soldOut && (
          <View style={styles.soldOutTag}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}
      </View>

      <Text style={styles.name}>{event.name}</Text>

      <View style={styles.genreTag}>
        <Text style={styles.genreText}>{event.genre.toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>VENUE</Text>
        <Text style={styles.venue}>{event.venue}</Text>
        <Text style={styles.area}>{event.area}</Text>

        {interested ? (
          <Text style={styles.address}>{event.address}</Text>
        ) : (
          <View style={styles.addressGate}>
            <Text style={styles.addressGateText}>
              Exact address revealed once you confirm you're interested.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmButtonPressed]}
              onPress={handleConfirmInterest}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color="#0D0D0D" />
              ) : (
                <Text style={styles.confirmButtonText}>I'M INTERESTED</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LINEUP</Text>
        {event.lineup.map((artist) => (
          <Text key={artist} style={styles.artist}>
            {artist}
          </Text>
        ))}
      </View>

      <View style={styles.soloCard}>
        <View style={styles.soloTextBlock}>
          <Text style={styles.soloTitle}>Going solo? Let others know</Text>
          <Text style={styles.soloSubtitle}>
            {goingSolo
              ? "You're visible to other solo attendees for this event."
              : 'Turn this on to signal you want to meet other people going alone.'}
          </Text>
        </View>
        <Switch
          value={goingSolo}
          onValueChange={setGoingSolo}
          trackColor={{ false: '#2A2A2A', true: '#245C3B' }}
          thumbColor={goingSolo ? '#4ADE80' : '#8A8A8A'}
        />
      </View>
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  soldOutTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: '#3A1414',
  },
  soldOutText: {
    color: '#FF5C5C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  genreTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: '#1E2E2A',
    marginBottom: 24,
  },
  genreText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#8A8A8A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  venue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  area: {
    color: '#B7B7B7',
    fontSize: 14,
    marginTop: 2,
  },
  address: {
    color: '#4ADE80',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  addressGate: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#161616',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
  },
  addressGateText: {
    color: '#8A8A8A',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmButtonPressed: {
    opacity: 0.85,
  },
  confirmButtonText: {
    color: '#0D0D0D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  artist: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  soloCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
    padding: 16,
    marginTop: 8,
  },
  soloTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  soloTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  soloSubtitle: {
    color: '#8A8A8A',
    fontSize: 12,
    lineHeight: 17,
  },
});
