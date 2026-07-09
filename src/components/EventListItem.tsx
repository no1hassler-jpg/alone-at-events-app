import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MusicEvent } from '../types/event';
import { formatEventDate } from '../utils/formatDate';

export function EventListItem({ event, onPress }: { event: MusicEvent; onPress: () => void }) {
  const { weekday, day, month } = formatEventDate(event.date);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.dateBlock}>
        <Text style={styles.weekday}>{weekday}</Text>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.month}>{month}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {event.name}
          </Text>
          {event.soldOut && (
            <View style={styles.soldOutTag}>
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          )}
        </View>

        <Text style={styles.venue}>
          {event.venue} · {event.area}
        </Text>

        <Text style={styles.lineup} numberOfLines={2}>
          {event.lineup.join(', ')}
        </Text>

        <View style={styles.genreTag}>
          <Text style={styles.genreText}>{event.genre.toUpperCase()}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A2A',
  },
  rowPressed: {
    backgroundColor: '#161616',
  },
  dateBlock: {
    width: 48,
    alignItems: 'center',
    marginRight: 14,
  },
  weekday: {
    color: '#8A8A8A',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  day: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  month: {
    color: '#8A8A8A',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  details: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    marginBottom: 4,
  },
  soldOutTag: {
    marginLeft: 8,
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
  venue: {
    color: '#B7B7B7',
    fontSize: 13,
    marginBottom: 6,
  },
  lineup: {
    color: '#8A8A8A',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  genreTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: '#1E2E2A',
  },
  genreText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
