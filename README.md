# Alone at Events

A mobile app that helps people attending live music events solo connect with others also going alone — so nobody has to go to a festival, club night, or gig by themselves unless they want to.

**Status:** In active development.

## What it does

- Browse the biggest upcoming music events in a city (currently London), with lineup, venue, date, and genre.
- Mark yourself as "going solo" to an event, and see others who've done the same.
- Chat 1-to-1 with other attendees before the event.
- Build a profile with your name, photo, age, bio, music taste tags, and social links.
- Report/block functionality for safety.
- Venue addresses stay hidden until you've confirmed interest in an event, as a light safety gate against casual scraping.

## Tech stack

- **React Native + Expo** — cross-platform mobile app
- **Firebase Authentication** — email/password sign-up and login
- **Firestore** — real-time database for profiles, chats, and event interest
- **TypeScript** throughout

## Architecture notes

- Firestore data is split into public and private documents per user (`users/{uid}` for public profile fields, `users/{uid}/private/data` for email and other sensitive fields), enforced by custom Firestore security rules — not just left on the open default.
- An `emailLookup` collection allows starting a chat by email without exposing any user's email address to other users directly.
- Chat participants and message senders are verified server-side via security rules, not just trusted client-side.

## Roadmap

- [x] Event listing with mock data
- [x] Authentication (email/password)
- [x] Profiles (public + private data split)
- [x] 1-to-1 chat
- [x] Firestore security rules
- [ ] Group chat per event, with the ability to message someone 1-to-1 from within it
- [ ] Real event data (currently using realistic mock data)
- [ ] Visual design pass, event photos
- [ ] Push notifications

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) to run on your device, or press `w` for the web preview.

You'll need your own Firebase project — create one at [console.firebase.google.com](https://console.firebase.google.com), enable Authentication (Email/Password) and Firestore, and add your config to `src/services/firebase.ts`.

## Why I built this

Solo event-going is genuinely common but still a bit awkward to navigate — most people either bring a friend or don't go. This app is a small attempt at lowering that barrier, and a project to properly learn React Native, Firebase, and thinking through real product/security trade-offs.
