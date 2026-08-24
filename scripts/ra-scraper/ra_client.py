"""Thin client for Resident Advisor's unofficial GraphQL API.

Hits https://ra.co/graphql directly - no authentication required, just a
browser-like Referer/User-Agent. This is an undocumented endpoint; see
README.md for the usage caveats.
"""

import logging
import time
from typing import Iterator

import requests

logger = logging.getLogger(__name__)

RA_GRAPHQL_URL = "https://ra.co/graphql"

RA_HEADERS = {
    "Content-Type": "application/json",
    "Referer": "https://ra.co/events/uk/london",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) "
        "Gecko/20100101 Firefox/106.0"
    ),
}

# Verified live against ra.co/graphql - extends the fields the reference
# scraper used with venue.address, venue.area, and genres, which our
# MusicEvent shape needs but the reference query didn't request.
EVENT_LISTINGS_QUERY = """
query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $filterOptions: FilterOptionsInputDtoInput, $page: Int, $pageSize: Int) {
  eventListings(filters: $filters, filterOptions: $filterOptions, pageSize: $pageSize, page: $page) {
    data {
      id
      listingDate
      event {
        id
        date
        startTime
        endTime
        title
        contentUrl
        attending
        isTicketed
        artists { id name }
        genres { name }
        venue { id name contentUrl live address area { name } }
      }
    }
    totalResults
  }
}
""".strip()

RETRY_DELAYS = (2, 4, 8)


class RaApiError(RuntimeError):
    """A page fetch failed after retries, or RA returned a GraphQL error."""


def fetch_page(
    session: requests.Session, date_from: str, date_to: str, page: int, page_size: int, area: int
) -> dict:
    """Fetch a single page of event listings. Raises RaApiError on failure."""
    payload = {
        "operationName": "GET_EVENT_LISTINGS",
        "variables": {
            "filters": {
                "areas": {"eq": area},
                "listingDate": {"gte": date_from, "lte": date_to},
            },
            "filterOptions": {"genre": True},
            "pageSize": page_size,
            "page": page,
        },
        "query": EVENT_LISTINGS_QUERY,
    }

    last_error: Exception | None = None
    for attempt, delay in enumerate((0, *RETRY_DELAYS)):
        if delay:
            logger.warning("Retrying page %d after %ds (attempt %d)", page, delay, attempt + 1)
            time.sleep(delay)
        try:
            response = session.post(RA_GRAPHQL_URL, headers=RA_HEADERS, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
        except (requests.exceptions.RequestException, ValueError) as exc:
            last_error = exc
            continue

        if "errors" in data:
            # A malformed query fails identically on every page - not worth retrying.
            raise RaApiError(f"RA GraphQL error on page {page}: {data['errors']}")
        if "data" not in data:
            last_error = RaApiError(f"Unexpected RA response shape on page {page}: {data}")
            continue

        return data["data"]["eventListings"]

    raise RaApiError(f"Failed to fetch page {page} after retries: {last_error}")


def fetch_all_events(
    date_from: str,
    date_to: str,
    page_size: int = 100,
    delay: float = 1.0,
    area: int = 13,
) -> Iterator[dict]:
    """Yield raw RA listing nodes (each wraps one `event`) across all pages.

    Stops once a page comes back empty or the cumulative count reaches the
    API-reported totalResults (checked both ways defensively).
    """
    session = requests.Session()
    page = 1
    fetched = 0
    total_results: int | None = None

    while True:
        listings = fetch_page(session, date_from, date_to, page, page_size, area)
        batch = listings["data"]
        total_results = listings["totalResults"]

        if not batch:
            break

        for node in batch:
            yield node

        fetched += len(batch)
        logger.info("Fetched page %d (%d/%s events so far)", page, fetched, total_results)

        if total_results is not None and fetched >= total_results:
            break

        page += 1
        time.sleep(delay)
