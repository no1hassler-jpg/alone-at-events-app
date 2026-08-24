"""Firestore Admin SDK init and batched upsert for scraped RA events.

Uses a service account key to bypass firestore.rules' `allow write: if
false` on the events collection - see README.md for how to obtain one.
"""

import logging
import time
from dataclasses import dataclass, field

import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)

BATCH_SIZE = 450  # headroom under Firestore's 500-ops-per-batch cap
COMMIT_RETRIES = 2
COMMIT_RETRY_DELAY = 3


class CredentialsError(RuntimeError):
    """Raised with an actionable message when the service account key can't be loaded."""


@dataclass
class UpsertResult:
    upserted: int = 0
    failed_batches: int = 0
    failed_ids: list[str] = field(default_factory=list)


def init_firestore(credentials_path: str) -> firestore.Client:
    try:
        cred = credentials.Certificate(credentials_path)
    except FileNotFoundError as exc:
        raise CredentialsError(
            f"Service account key not found at '{credentials_path}'.\n"
            "Generate one from the Firebase console (Project Settings > Service "
            "Accounts > Generate new private key) and place it at that path, "
            "pass --credentials, or set GOOGLE_APPLICATION_CREDENTIALS. "
            "See README.md."
        ) from exc
    except ValueError as exc:
        raise CredentialsError(
            f"'{credentials_path}' doesn't look like a valid service account key: {exc}"
        ) from exc

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    return firestore.client()


def upsert_events(
    db: firestore.Client, events: list, dry_run: bool = False, batch_size: int = BATCH_SIZE
) -> UpsertResult:
    """Upsert mapped events (list of mapping.MappedEvent) into events/ra_<id>.

    Uses set(merge=True) so re-running is always safe: refreshes existing
    docs, adds new ones, never duplicates. Each batch commit is retried a
    couple of times; a batch that still fails is logged and skipped rather
    than aborting the whole run - already-committed batches are real,
    durable progress worth keeping.
    """
    result = UpsertResult()

    if dry_run:
        result.upserted = len(events)
        return result

    collection = db.collection("events")

    for i in range(0, len(events), batch_size):
        chunk = events[i : i + batch_size]
        batch = db.batch()
        for mapped in chunk:
            doc_ref = collection.document(f"ra_{mapped.ra_id}")
            batch.set(doc_ref, mapped.data, merge=True)

        committed = False
        for attempt in range(COMMIT_RETRIES + 1):
            try:
                batch.commit()
                committed = True
                break
            except Exception as exc:  # noqa: BLE001 - genuinely want to catch+continue here
                if attempt < COMMIT_RETRIES:
                    logger.warning(
                        "Batch commit failed (attempt %d), retrying in %ds: %s",
                        attempt + 1,
                        COMMIT_RETRY_DELAY,
                        exc,
                    )
                    time.sleep(COMMIT_RETRY_DELAY)
                else:
                    logger.error("Batch commit failed after retries: %s", exc)

        if committed:
            result.upserted += len(chunk)
        else:
            result.failed_batches += 1
            result.failed_ids.extend(m.ra_id for m in chunk)

    return result
