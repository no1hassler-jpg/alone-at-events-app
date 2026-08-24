"""Maps raw RA GraphQL nodes onto the app's MusicEvent shape (src/types/event.ts).

Pure functions, deliberately dependency-free, so they're easy to unit test -
this is the fragile heuristic part of the pipeline (see parse_address).
"""

from dataclasses import dataclass, field


class MappingError(ValueError):
    """A listing is missing a field we have no sane fallback for - skip it."""


@dataclass
class MappedEvent:
    ra_id: str
    data: dict
    fallbacks: list[str] = field(default_factory=list)


def parse_genre(genres: list[dict], fallback: str = "Electronic") -> tuple[str, bool]:
    """Join genre names, or return the fallback if RA gave us none.

    Returns (genre, used_fallback).
    """
    names = [g["name"] for g in genres if g.get("name")]
    if not names:
        return fallback, True
    return " / ".join(names), False


def parse_address(raw_address: str | None, area_fallback: str) -> tuple[str, str, bool]:
    """Split RA's raw venue address into (area, address, used_fallback).

    RA's venue.address is a single string with inconsistent delimiters, e.g.:
      "1a Camden High Street; Camden Town; London NW1 7JE; United Kingdom"
      "110 Pennington Street, Wapping, London E1W 2BB"

    The neighbourhood is the segment immediately before the "London <postcode>"
    segment in both observed forms. When that pattern doesn't hold (e.g. only
    a street + postcode segment, no named neighbourhood), fall back to the
    venue's city-level area name (typically just "London").
    """
    if not raw_address or not raw_address.strip():
        return area_fallback, area_fallback, True

    delimiter = ";" if ";" in raw_address else ","
    segments = [s.strip() for s in raw_address.split(delimiter) if s.strip()]

    if segments and segments[-1].lower() == "united kingdom":
        segments = segments[:-1]

    address = ", ".join(segments) if segments else raw_address.strip()

    london_index = next(
        (i for i, s in enumerate(segments) if s.lower().startswith("london")), None
    )

    # Need a genuine middle segment (street, neighbourhood, London-postcode) -
    # london_index == 1 means only [street, "London ..."], no real neighbourhood.
    if london_index is not None and london_index >= 2:
        return segments[london_index - 1], address, False

    return area_fallback, address, True


def map_event(node: dict) -> MappedEvent:
    """Map one RA listing node to a MusicEvent-shaped dict (minus `id` - the
    Firestore doc ID carries that, matching this repo's existing convention
    of never duplicating the doc ID inside the document body).

    Raises MappingError for listings missing a field with no sane fallback.
    """
    event = node.get("event") or {}

    ra_id = event.get("id")
    title = event.get("title")
    date = event.get("date")
    venue = event.get("venue") or {}
    venue_name = venue.get("name")

    if not ra_id:
        raise MappingError("missing event.id")
    if not title:
        raise MappingError(f"missing title (event id {ra_id})")
    if not date:
        raise MappingError(f"missing date (event id {ra_id})")
    if not venue_name:
        raise MappingError(f"missing venue.name (event id {ra_id})")

    fallbacks: list[str] = []

    area_city_fallback = (venue.get("area") or {}).get("name") or "London"
    area, address, used_address_fallback = parse_address(venue.get("address"), area_city_fallback)
    if used_address_fallback:
        fallbacks.append("area")

    genre, used_genre_fallback = parse_genre(event.get("genres") or [])
    if used_genre_fallback:
        fallbacks.append("genre")

    lineup = [a["name"] for a in (event.get("artists") or []) if a.get("name")]

    data = {
        "name": title,
        "date": date.split("T")[0],
        "venue": venue_name,
        "area": area,
        "address": address,
        "lineup": lineup,
        "genre": genre,
        # soldOut is deliberately never set here (not even to None/False) -
        # RA gives us no reliable signal for it, and Firestore's merge=True
        # writes an explicit null for any key present with value None,
        # which would clobber a real value if anything else ever sets one.
    }

    return MappedEvent(ra_id=str(ra_id), data=data, fallbacks=fallbacks)
