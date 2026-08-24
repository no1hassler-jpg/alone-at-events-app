# RA → Firestore event sync

Fetches upcoming London events from Resident Advisor's unofficial GraphQL
API (`https://ra.co/graphql`) and upserts them into this app's Firestore
`events` collection, shaped to match `src/types/event.ts`'s `MusicEvent`.

Meant to be run manually every couple of weeks to keep listings current —
not scheduled/automated. Safe to re-run: events are keyed by RA's own event
id (`events/ra_<id>`) and written with merge semantics, so re-running
refreshes existing events and adds new ones without duplicating.

## Setup

```bash
cd scripts/ra-scraper
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Requires Python 3.10+.

### Service account key

Firestore's security rules block all client writes to `events` by design —
this script needs a Firebase **Admin SDK** service account key, which
bypasses security rules entirely:

1. Firebase console → `alone-at-events` project → gear icon → **Project
   Settings** → **Service Accounts** tab → **Generate new private key**.
   This downloads a JSON file.
2. Place it at the repo root as `serviceAccountKey.json` (already
   gitignored — double check with `git check-ignore serviceAccountKey.json`
   before it's anywhere near a commit), or pass `--credentials /path/to/key.json`,
   or `export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`.

**This key has full read/write access to the entire Firestore project,
bypassing every security rule. Treat it like a root password — never commit
it, never share it.**

## Usage

Validate fetching and the data-mapping heuristics first, without touching
Firestore or needing credentials at all:

```bash
python scrape_ra_events.py --dry-run --days 14
```

Then a real run (defaults to today through +90 days):

```bash
python scrape_ra_events.py
```

Useful flags:

```
--from YYYY-MM-DD    start date (default: today)
--to YYYY-MM-DD       end date (default: +90 days) — mutually exclusive with --days
--days N              end date as N days from --from
--area N               RA area code (default: 13 = London)
--page-size N          events per GraphQL page (default: 100)
--delay SECONDS        pause between page requests (default: 1.0)
--credentials PATH     service account key path
--dry-run              fetch + map + print summary, skip Firestore entirely
--limit N               only upsert the first N mapped events (smoke-testing)
-v, --verbose           debug logging + full tracebacks
```

Example smoke test against the real project without a big write:

```bash
python scrape_ra_events.py --days 14 --limit 20
```

## Known limitations

- **Update + add only, never deletes.** Events that fall out of the
  requested date window or disappear from RA between runs are left in
  Firestore untouched. There's no pruning of stale/cancelled events.
- **Neighbourhood parsing is heuristic**, not authoritative — RA only
  exposes a raw venue address string, not a structured neighbourhood field
  (confirmed: `Venue` has no `borough`/`neighbourhood` field, only free-text
  `address` and a city-level `area.name` that's always just `"London"`).
  The script parses the address best-effort and falls back to `"London"`
  when it can't confidently extract a neighbourhood. In practice **most RA
  venue addresses don't cleanly include one** — a live run against ~650
  upcoming London events had roughly two-thirds fall back to `"London"`,
  since most addresses are just `"<street>, London <postcode>"` with no
  separate neighbourhood segment. The run summary reports the exact
  fallback count on every run so you can see this directly rather than be
  surprised by it.
- **No reliable "sold out" signal** in RA's listing data, so the optional
  `soldOut` field is never set by this script.

## A note on the API itself

This hits an undocumented, unofficial RA endpoint with no auth wall. It's
not a published/supported API, and automated access like this is likely
outside RA's Terms of Service — review their ToS yourself if you plan to
rely on this long-term. It's intended for low-frequency personal/manual
use only, and could change, break, or get blocked without notice at any
time.

## Running tests

```bash
pip install pytest  # not in requirements.txt - only needed for development
pytest tests/
```
