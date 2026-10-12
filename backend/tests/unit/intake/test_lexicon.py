"""The category lexicon (US-02): loads and validates, matches whole words, prefers the longest synonym."""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml  # type: ignore[import-untyped]

from app.intake.lexicon import DEFAULT_LEXICON_PATH, LexiconError, load_lexicon

# Every category US-02 asks for by name.
REQUIRED = [
    *("laptop", "smartphone", "tablet", "earbuds", "headphones", "smartwatch", "fitness_band", "analog_watch"),
    *("television", "monitor", "keyboard", "mouse", "printer", "router", "bluetooth_speaker", "power_bank"),
    *("camera", "refrigerator", "washing_machine", "air_conditioner", "air_purifier", "water_purifier", "geyser"),
    *("ceiling_fan", "vacuum_cleaner", "mixer_grinder", "microwave", "induction_cooktop", "electric_kettle"),
    *("trimmer", "hair_dryer", "mattress", "office_chair", "standing_desk", "running_shoes", "backpack", "pram"),
    *("car_seat", "baby_monitor"),
]


def _raw() -> dict[str, object]:
    data: dict[str, object] = yaml.safe_load(DEFAULT_LEXICON_PATH.read_text(encoding="utf-8"))
    return data


def _write(tmp_path: Path, data: object) -> Path:
    path = tmp_path / "categories.yaml"
    path.write_text(yaml.safe_dump(data), encoding="utf-8")
    return path


def test_the_real_lexicon_loads_with_every_required_category() -> None:
    lexicon = load_lexicon()
    assert len(lexicon.categories) >= 40
    assert set(REQUIRED) <= set(lexicon.categories)


@pytest.mark.parametrize(
    ("text", "slug"),
    [
        ("mobile under 15k", "smartphone"),
        ("a good fridge", "refrigerator"),
        ("AC for my bedroom", "air_conditioner"),
        ("geyser for winter", "geyser"),
        ("TWS under 2k", "earbuds"),
        ("pram for a newborn", "pram"),
        ("Laptops for students", "laptop"),
        ("mixie for the kitchen", "mixer_grinder"),
        ("induction chulha", "induction_cooktop"),
    ],
)
def test_indian_english_synonyms(text: str, slug: str) -> None:
    assert load_lexicon().scan(text).category == slug


def test_the_longest_synonym_wins() -> None:
    lexicon = load_lexicon()
    assert lexicon.scan("smart watch for running").category == "smartwatch"
    assert lexicon.scan("Smart-Watch").category == "smartwatch"
    assert lexicon.scan("baby monitor with night vision").category == "baby_monitor"
    assert lexicon.scan("laptop bag for travel").category == "backpack"
    assert lexicon.scan("inverter ac 1.5 ton").category == "air_conditioner"


def test_matching_is_whole_words_only() -> None:
    lexicon = load_lexicon()
    assert lexicon.scan("a program for my kid").category is None  # "pram" is inside "program"
    assert lexicon.scan("a tvs scooter").category == "television"  # plural of "tv" is still a whole word
    assert lexicon.scan("deactivate my account").category is None  # "ac" inside a word


def test_the_first_category_mentioned_wins() -> None:
    assert load_lexicon().scan("earbuds that work with my phone").category == "earbuds"


def test_ambiguous_words_need_a_question() -> None:
    lexicon = load_lexicon()
    watch = lexicon.scan("watch under 5k")
    assert watch.category is None and watch.ambiguous is not None
    assert lexicon.labels(watch.ambiguous.options) == ["Smartwatch", "Fitness band", "Analog watch"]
    monitor = lexicon.scan("monitor for coding").ambiguous
    assert monitor is not None and lexicon.labels(monitor.options) == ["Computer monitor", "Baby monitor"]
    speaker = lexicon.scan("speakers for a party").ambiguous
    assert speaker is not None and lexicon.labels(speaker.options) == [
        "Bluetooth speaker",
        "Home theatre",
        "Smart speaker",
    ]


def test_an_ambiguous_word_is_ignored_when_a_category_is_named() -> None:
    assert load_lexicon().scan("earbuds that pair with my watch").category == "earbuds"


def test_lookup_maps_names_to_slugs() -> None:
    lexicon = load_lexicon()
    assert lexicon.lookup("Air conditioners") == "air_conditioner"
    assert lexicon.lookup("FRIDGE") == "refrigerator"
    assert lexicon.lookup("washing machine") == "washing_machine"
    assert lexicon.lookup("yoga mat") is None
    assert lexicon.ambiguous_entry("Watches") is not None
    assert lexicon.ambiguous_entry("laptop") is None


def test_duplicate_slug_fails(tmp_path: Path) -> None:
    data = _raw()
    data["categories"].append({**data["categories"][0], "synonyms": ["other word"]})  # type: ignore[attr-defined, index]
    with pytest.raises(LexiconError, match="unique"):
        load_lexicon(_write(tmp_path, data))


def test_bad_slug_fails(tmp_path: Path) -> None:
    data = _raw()
    data["categories"][0]["slug"] = "Bad Slug"  # type: ignore[index]
    with pytest.raises(LexiconError, match="slug"):
        load_lexicon(_write(tmp_path, data))


def test_synonym_shared_by_two_categories_fails(tmp_path: Path) -> None:
    data = _raw()
    data["categories"][1]["synonyms"].append("laptop")  # type: ignore[index]
    with pytest.raises(LexiconError, match="used by both"):
        load_lexicon(_write(tmp_path, data))


def test_option_naming_an_unknown_category_fails(tmp_path: Path) -> None:
    data = _raw()
    data["ambiguous"][0]["options"].append("sundial")  # type: ignore[index]
    with pytest.raises(LexiconError, match="unknown categories"):
        load_lexicon(_write(tmp_path, data))


def test_ambiguous_word_that_is_also_a_synonym_fails(tmp_path: Path) -> None:
    data = _raw()
    data["ambiguous"][0]["word"] = "laptop"  # type: ignore[index]
    with pytest.raises(LexiconError, match="also a synonym"):
        load_lexicon(_write(tmp_path, data))


def test_missing_file_fails_clearly(tmp_path: Path) -> None:
    with pytest.raises(LexiconError, match="cannot read"):
        load_lexicon(tmp_path / "nope.yaml")
