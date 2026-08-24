import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from mapping import MappingError, map_event, parse_address, parse_genre  # noqa: E402


def test_parse_address_semicolon_delimited():
    area, address, used_fallback = parse_address(
        "1a Camden High Street; Camden Town; London NW1 7JE; United Kingdom", "London"
    )
    assert area == "Camden Town"
    assert address == "1a Camden High Street, Camden Town, London NW1 7JE"
    assert used_fallback is False


def test_parse_address_comma_delimited():
    area, address, used_fallback = parse_address(
        "110 Pennington Street, Wapping, London E1W 2BB", "London"
    )
    assert area == "Wapping"
    assert address == "110 Pennington Street, Wapping, London E1W 2BB"
    assert used_fallback is False


def test_parse_address_no_neighbourhood_falls_back():
    area, address, used_fallback = parse_address("221B Baker Street, London NW1 6XE", "London")
    assert area == "London"
    assert address == "221B Baker Street, London NW1 6XE"
    assert used_fallback is True


def test_parse_address_missing_falls_back():
    area, address, used_fallback = parse_address(None, "London")
    assert area == "London"
    assert address == "London"
    assert used_fallback is True


def test_parse_genre_joins_multiple():
    genre, used_fallback = parse_genre([{"name": "House"}, {"name": "Tech House"}])
    assert genre == "House / Tech House"
    assert used_fallback is False


def test_parse_genre_empty_falls_back():
    genre, used_fallback = parse_genre([])
    assert genre == "Electronic"
    assert used_fallback is True


def test_map_event_happy_path():
    node = {
        "event": {
            "id": "2454769",
            "title": "KOKO Electronic: Summer Closing",
            "date": "2026-08-21T00:00:00.000",
            "artists": [{"name": "Test Artist"}],
            "genres": [{"name": "House"}],
            "venue": {
                "name": "KOKO",
                "address": "1a Camden High Street; Camden Town; London NW1 7JE; United Kingdom",
                "area": {"name": "London"},
            },
        }
    }
    mapped = map_event(node)
    assert mapped.ra_id == "2454769"
    assert mapped.data["name"] == "KOKO Electronic: Summer Closing"
    assert mapped.data["date"] == "2026-08-21"
    assert mapped.data["venue"] == "KOKO"
    assert mapped.data["area"] == "Camden Town"
    assert mapped.data["lineup"] == ["Test Artist"]
    assert mapped.data["genre"] == "House"
    assert "soldOut" not in mapped.data
    assert "id" not in mapped.data
    assert mapped.fallbacks == []


def test_map_event_empty_lineup_and_genre_fallback():
    node = {
        "event": {
            "id": "999",
            "title": "Some Night",
            "date": "2026-09-01T00:00:00.000",
            "artists": [],
            "genres": [],
            "venue": {"name": "Some Venue", "address": None, "area": {"name": "London"}},
        }
    }
    mapped = map_event(node)
    assert mapped.data["lineup"] == []
    assert mapped.data["genre"] == "Electronic"
    assert mapped.data["area"] == "London"
    assert set(mapped.fallbacks) == {"area", "genre"}


def test_map_event_missing_title_raises():
    node = {"event": {"id": "1", "date": "2026-09-01T00:00:00.000", "venue": {"name": "V"}}}
    try:
        map_event(node)
        assert False, "expected MappingError"
    except MappingError:
        pass
