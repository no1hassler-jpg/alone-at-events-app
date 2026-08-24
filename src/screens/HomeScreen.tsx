import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventListItem } from '../components/EventListItem';
import { RootStackParamList } from '../navigation/types';
import { subscribeToUpcomingEvents } from '../services/eventService';
import { MusicEvent } from '../types/event';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [events, setEvents] = useState<MusicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeToUpcomingEvents((nextEvents) => {
      setEvents(nextEvents);
      setLoading(false);
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.city}>LONDON</Text>
        <Text style={styles.subtitle}>Biggest events this month</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#4ADE80" />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No upcoming events yet.</Text>
          <Text style={styles.emptySubtext}>Check back soon for new listings.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventListItem
              event={item}
              onPress={() => navigation.navigate('EventDetail', { event: item })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  city: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#8A8A8A',
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtext: {
    color: '#8A8A8A',
    fontSize: 13,
    textAlign: 'center',
  },
});
