import { collection, DocumentData, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MusicEvent } from '../types/event';

function toEvent(id: string, data: DocumentData): MusicEvent {
  return {
    id,
    name: data.name ?? '',
    date: data.date ?? '',
    venue: data.venue ?? '',
    area: data.area ?? '',
    address: data.address ?? '',
    lineup: data.lineup ?? [],
    genre: data.genre ?? '',
    soldOut: data.soldOut,
  };
}

// Only ever shows events today or later - events/{eventId} docs aren't
// pruned when they fall in the past (see scripts/ra-scraper), so this
// filter is what keeps past events out of the list.
export function subscribeToUpcomingEvents(callback: (events: MusicEvent[]) => void) {
  const today = new Date().toISOString().slice(0, 10);
  const q = query(collection(db, 'events'), where('date', '>=', today), orderBy('date', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => toEvent(d.id, d.data())));
  });
}
