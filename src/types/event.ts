export interface MusicEvent {
  id: string;
  name: string;
  date: string; // ISO date, e.g. "2026-07-18"
  venue: string;
  area: string; // neighbourhood, shown publicly, e.g. "Hackney Wick"
  address: string; // exact street address, only revealed after confirmed interest
  lineup: string[];
  genre: string;
  soldOut?: boolean;
}
