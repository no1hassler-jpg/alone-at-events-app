import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventListItem } from '../components/EventListItem';
import { mockEvents } from '../data/mockEvents';
import { RootStackParamList } from '../navigation/types';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.city}>LONDON</Text>
        <Text style={styles.subtitle}>Biggest events this month</Text>
      </View>

      <FlatList
        data={mockEvents}
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
});
