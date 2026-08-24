# Alone at Events

A mobile app that helps people attending live music events solo connect with others also going alone — so nobody has to skip a night out just because a friend can't come.

**Status:** In active development. Core functionality built, tested, and running against real London event data.

## What it does

- Browse upcoming London electronic music events — lineup, venue, date, and genre, pulled from live data (not placeholders).
- Mark yourself "going solo" to an event, and get auto-joined into a shared group chat with everyone else going solo to that event.
- Message the whole group, or tap anyone's name to open a private 1-to-1 chat with them.
- Build a profile: name, photo, age, bio, music taste tags, social links.
- Report/block functionality, reachable from both chats and profiles.
- Venue addresses stay hidden until you've confirmed interest in an event, as a light safety gate.

## Tech stack

- **React Native + Expo** — cross-platform mobile app
- **Firebase Authentication** — email/password sign-up and login
- **Firestore** — real-time database for profiles, events, and chat
- **Python** — standalone data pipeline pulling real event data from Resident Advisor's GraphQL API into Firestore
- **TypeScript** throughout the app; unit-tested Python for the data pipeline

## Engineering approach

This project was built solo, using Claude Code as a development accelerator — but every architectural decision, trade-off, and piece of judgment below was mine, made through active review rather than accepting output unreviewed. A few examples worth calling out:

**Security architecture.** The database was initially left on Firebase's open default rules — any signed-in user could read anyone's private data. I redesigned the data model to split each user's profile into a public document and an owner-only private subcollection, then wrote custom Firestore security rules to enforce it. This created a real conflict: privatizing email broke an existing "start a chat by email" feature. Rather than accept either a security hole or a broken feature, I added a minimal lookup-only collection that resolves an email to a user ID without ever exposing the email itself — then validated the fix live, with two real test accounts, exercising both the allowed paths (joining, reading, writing as an authorized participant) and confirming the denied paths were correctly rejected. That's manual, targeted verification rather than an automated test suite — no rules test file exists in this repo yet, which is a fair gap to close before this goes further.

**Debugging a three-layer production bug.** Building group chat surfaced a genuinely subtle failure chain: a security rule crashed when checking permissions on a chat document that didn't yet exist, which revealed a chicken-and-egg problem (a new user couldn't check if a group chat existed in order to join it), which in turn revealed a Firestore SDK quirk where a permission-denied real-time listener never automatically retries, even after permissions later become valid. I diagnosed this methodically — cross-verifying from a second test account and adding temporary debug logging to confirm root cause — rather than guessing at fixes.

**A real data-source limitation, investigated rather than assumed.** Building the event data pipeline, roughly two-thirds of scraped venues fell back to a generic "London" area label instead of a real neighbourhood. Rather than treating this as a parsing bug, I verified directly against Resident Advisor's live GraphQL schema that no structured neighbourhood field exists on their venue data at all — this is a genuine characteristic of the source, not a fixable bug — and documented the actual observed rate rather than hiding it.

**Product trade-offs, not just technical ones.** Decided group chats should surface in the main chat list rather than be buried on event pages, because discoverability through habit matters more than marginally cleaner architecture. Decided chat membership should stay permanent even after someone un-flags "going solo," since abruptly removing someone mid-conversation felt punitive for what's often just a small change of plan.

## Data pipeline

Real event data is sourced from Resident Advisor's unofficial GraphQL API via a standalone Python script (`scripts/ra-scraper/`), run manually every couple of weeks. It's idempotent (safe to re-run without creating duplicates), and unit-tested (9 tests covering the address/genre parsing heuristics). The `events` collection currently holds **878 real, live London events**. A separate 90-day dry run (fetch + map, no Firestore writes) validated the pipeline at larger scale: 1,783 unique events mapped with zero mapping failures. Full details, including honest documentation of data-source limitations and ToS considerations, are in the script's own README.

## Roadmap

- [x] Real event data pipeline (Resident Advisor)
- [x] Authentication (email/password)
- [x] Profiles (public/private data split, enforced via security rules)
- [x] 1-to-1 chat
- [x] Event-based group chat with tap-to-DM
- [x] Firestore security rules, manually verified against both allow and deny paths
- [ ] Day-grouped, popularity-ranked event browsing, with an expandable per-day list
- [ ] Automated Firestore rules test suite
- [ ] Visual design system (defined, not yet applied to existing screens)
- [ ] Push notifications

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) to run on your device, or press `w` for the web preview.

You'll need your own Firebase project — create one at [console.firebase.google.com](https://console.firebase.google.com/), enable Authentication (Email/Password) and Firestore, and add your config to `src/firebase/config.ts`.

## Why I built this

Solo event-going is common but still a bit awkward to navigate — most people either bring a friend or don't go. This app is a small attempt at lowering that barrier, and a project to properly learn full-stack mobile development, real backend security architecture, and how to work effectively alongside AI coding tools while retaining ownership of the actual engineering decisions.
