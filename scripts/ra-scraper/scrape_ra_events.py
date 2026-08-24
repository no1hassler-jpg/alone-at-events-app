#!/usr/bin/env python3
"""Fetch upcoming London events from Resident Advisor and upsert them into
this app's Firestore `events` collection.

Safe to re-run: keys documents by RA's own event id (events/ra_<id>) and
upserts with merge semantics, so re-running refreshes existing events and
adds new ones without duplicating or failing on already-present docs.

Usage:
    python scrape_ra_events.py --dry-run --days 14
    python scrape_ra_events.py --days 90 --credentials ../../serviceAccountKey.json

See README.md for setup (service account key, etc).
"""

import argparse
import collections
import logging
import os
import sys
import time
from datetime import datetime, timedelta, timezone

from firestore_sync import CredentialsError, init_firestore, upsert_events
from mapping import MappingError, map_event
from ra_client import RaApiError, fetch_all_events

DEFAULT_CREDENTIALS_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "serviceAccountKey.json"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--from", dest="date_from", type=str, help="Start date, YYYY-MM-DD (default: today).")

    date_to_group = parser.add_mutually_exclusive_group()
    date_to_group.add_argument("--to", dest="date_to", type=str, help="End date, YYYY-MM-DD (default: +90 days).")
    date_to_group.add_argument("--days", type=int, help="End date as N days from --from, instead of --to.")

    parser.add_argument("--area", type=int, default=13, help="RA area code (default: 13, London).")
    parser.add_argument("--page-size", type=int, default=100, help="Events per GraphQL page (default: 100).")
    parser.add_argument("--delay", type=float, default=1.0, help="Seconds to sleep between page requests (default: 1.0).")
    parser.add_argument(
        "--credentials",
        type=str,
        default=None,
        help="Path to a Firebase service account JSON key. "
        "Falls back to $GOOGLE_APPLICATION_CREDENTIALS, then ./serviceAccountKey.json at repo root.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Fetch and map events but don't write to Firestore.")
    parser.add_argument("--limit", type=int, default=None, help="Only upsert the first N mapped events (for smoke-testing).")
    parser.add_argument("-v", "--verbose", action="store_true", help="Debug logging + full tracebacks on error.")

    args = parser.parse_args()

    today = datetime.now(timezone.utc).date()
    start = datetime.strptime(args.date_from, "%Y-%m-%d").date() if args.date_from else today
    if args.date_to:
        end = datetime.strptime(args.date_to, "%Y-%m-%d").date()
    elif args.days:
        end = start + timedelta(days=args.days)
    else:
        end = start + timedelta(days=90)

    args.date_from = start.strftime("%Y-%m-%dT00:00:00.000Z")
    args.date_to = end.strftime("%Y-%m-%dT23:59:59.999Z")
    return args


def resolve_credentials_path(cli_value: str | None) -> str:
    if cli_value:
        return cli_value
    if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        return os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
    return DEFAULT_CREDENTIALS_PATH


def main() -> int:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%H:%M:%S",
    )
    logger = logging.getLogger("scrape_ra_events")
    start_time = time.monotonic()

    db = None
    if not args.dry_run:
        credentials_path = resolve_credentials_path(args.credentials)
        try:
            db = init_firestore(credentials_path)
        except CredentialsError as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 1

    logger.info(
        "Fetching London events from %s to %s (area %d)...", args.date_from, args.date_to, args.area
    )

    listings_fetched = 0
    mapped_by_id: dict[str, object] = {}
    skip_reasons: collections.Counter = collections.Counter()
    fallback_counts: collections.Counter = collections.Counter()

    try:
        for node in fetch_all_events(
            args.date_from, args.date_to, page_size=args.page_size, delay=args.delay, area=args.area
        ):
            listings_fetched += 1
            try:
                mapped = map_event(node)
            except MappingError as exc:
                skip_reasons[str(exc).split(" (")[0]] += 1
                logger.debug("Skipped listing: %s", exc)
                continue

            mapped_by_id[mapped.ra_id] = mapped
            for fb in mapped.fallbacks:
                fallback_counts[fb] += 1
    except RaApiError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    events = list(mapped_by_id.values())
    if args.limit is not None:
        events = events[: args.limit]

    result = upsert_events(db, events, dry_run=args.dry_run)

    elapsed = time.monotonic() - start_time
    print("\n--- Run summary ---")
    print(f"Listings fetched:   {listings_fetched}")
    print(f"Unique events:      {len(mapped_by_id)}")
    print(f"Mapped/considered:  {len(events)}{' (--limit applied)' if args.limit else ''}")
    print(f"Skipped:            {sum(skip_reasons.values())}")
    for reason, count in skip_reasons.most_common():
        print(f"  - {reason}: {count}")
    print(f"Area fallback used: {fallback_counts['area']}")
    print(f"Genre fallback used:{fallback_counts['genre']:>4}")
    if args.dry_run:
        print(f"Would upsert:       {result.upserted} (dry run - nothing written)")
    else:
        print(f"Upserted:           {result.upserted}")
        print(f"Failed batches:     {result.failed_batches}")
        if result.failed_ids:
            print(f"Failed event ids:   {', '.join(result.failed_ids)}")
    print(f"Elapsed:            {elapsed:.1f}s")

    return 1 if result.failed_batches else 0


if __name__ == "__main__":
    sys.exit(main())
