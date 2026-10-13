"""Fallback criteria sets (US-03): a valid, plain-English set per product family and for common categories."""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml  # type: ignore[import-untyped]

from app.contracts import CriteriaInput, CriteriaSet
from app.contracts.criteria import VAGUE_CRITERIA
from app.criteria.fallback import (
    DEFAULT_FALLBACK_PATH,
    GENERIC_FAMILY,
    CriteriaConfigError,
    fallback_criteria,
    fallback_set,
    family_for,
    family_set,
    load_category_sets,
    load_fallback_sets,
)
from app.intake.lexicon import load_lexicon, words

REQUIRED_FAMILIES = {
    "computing",
    "phone",
    "audio",
    "wearable",
    "tv_and_camera",
    "large_appliance",
    "kitchen_appliance",
    "home_comfort",
    "personal_care",
    "baby",
    "furniture",
    "footwear_and_bags",
    "generic",
}
FAMILIES = sorted(load_fallback_sets())


def test_every_required_family_exists() -> None:
    assert set(FAMILIES) >= REQUIRED_FAMILIES


@pytest.mark.parametrize("family", FAMILIES)
def test_each_family_builds_a_valid_criteria_set(family: str) -> None:
    criteria = load_fallback_sets()[family].criteria
    built = CriteriaSet(category="anything", criteria=criteria, source="fallback")
    assert CriteriaSet.model_validate_json(built.model_dump_json()) == built
    assert 7 <= len(criteria) <= 8
    assert sum(c.is_value_for_money for c in criteria) == 1
    assert not {c.key for c in criteria} & (VAGUE_CRITERIA - {"value"})


@pytest.mark.parametrize("family", FAMILIES)
def test_definitions_are_plain_one_liners_not_the_label(family: str) -> None:
    for c in load_fallback_sets()[family].criteria:
        count = len(c.definition.split())
        assert 10 <= count <= 25, f"{family}.{c.key}: {count} words"
        assert "\n" not in c.definition
        new_words = set(words(c.definition)) - set(words(c.label))
        assert len(new_words) >= 5, f"{family}.{c.key} only repeats its label"
        assert 0 <= c.default_weight <= 10


def test_every_lexicon_category_maps_to_a_family() -> None:
    lexicon = load_lexicon()
    families = load_fallback_sets()
    for slug in lexicon.categories:
        assert lexicon.family_of(slug) in families, slug
        assert family_for(slug) == lexicon.family_of(slug)


@pytest.mark.parametrize(
    ("category", "family"),
    [("laptop", "computing"), ("pram", "baby"), ("mixer_grinder", "kitchen_appliance"), ("standing_desk", "furniture")],
)
def test_known_categories_use_their_family(category: str, family: str) -> None:
    assert family_for(category) == family


def test_an_unknown_category_gets_generic() -> None:
    assert family_for("yoga_mat") == GENERIC_FAMILY
    result = fallback_set(CriteriaInput(category="yoga_mat", category_label="Yoga mat", use_case="beginners"))
    assert (result.category, result.use_case, result.source) == ("yoga_mat", "beginners", "fallback")
    assert result.criteria == load_fallback_sets()[GENERIC_FAMILY].criteria


def _raw() -> dict[str, object]:
    data: dict[str, object] = yaml.safe_load(DEFAULT_FALLBACK_PATH.read_text(encoding="utf-8"))
    return data


def _write(tmp_path: Path, data: object) -> Path:
    path = tmp_path / "criteria_fallback.yaml"
    path.write_text(yaml.safe_dump(data), encoding="utf-8")
    return path


def test_a_family_named_by_categories_yaml_must_exist(tmp_path: Path) -> None:
    data = _raw()
    del data["families"]["baby"]  # type: ignore[attr-defined]
    with pytest.raises(CriteriaConfigError, match="baby"):
        load_fallback_sets(_write(tmp_path, data))


def test_a_set_without_value_for_money_fails(tmp_path: Path) -> None:
    data = _raw()
    for row in data["families"]["phone"]["criteria"]:  # type: ignore[index]
        row["is_value_for_money"] = False
    with pytest.raises(CriteriaConfigError, match="value-for-money"):
        load_fallback_sets(_write(tmp_path, data))


def test_a_set_with_too_few_criteria_fails(tmp_path: Path) -> None:
    data = _raw()
    data["families"]["generic"]["criteria"] = data["families"]["generic"]["criteria"][:6]  # type: ignore[index]
    with pytest.raises(CriteriaConfigError):
        load_fallback_sets(_write(tmp_path, data))


def test_a_missing_file_fails_clearly(tmp_path: Path) -> None:
    with pytest.raises(CriteriaConfigError, match="cannot read"):
        load_fallback_sets(tmp_path / "nope.yaml")


# --- category-level sets (lookup order: category -> family -> generic) ---------------------------

REQUIRED_CATEGORY_SETS = {
    "laptop",
    "smartphone",
    "earbuds",
    "headphones",
    "smartwatch",
    "television",
    "standing_desk",
    "mattress",
}
CATEGORY_SETS = sorted(load_category_sets())


def test_every_required_category_has_its_own_set() -> None:
    assert set(CATEGORY_SETS) >= REQUIRED_CATEGORY_SETS


@pytest.mark.parametrize("category", CATEGORY_SETS)
def test_each_category_set_builds_a_valid_criteria_set(category: str) -> None:
    built = fallback_set(CriteriaInput(category=category, category_label=category.replace("_", " "), use_case="home"))
    assert CriteriaSet.model_validate_json(built.model_dump_json()) == built
    assert built.source == "fallback"
    assert built.criteria == load_category_sets()[category].criteria
    assert 7 <= len(built.criteria) <= 8
    assert sum(c.is_value_for_money for c in built.criteria) == 1


@pytest.mark.parametrize("category", CATEGORY_SETS)
def test_category_definitions_are_plain_one_liners_not_the_label(category: str) -> None:
    for c in load_category_sets()[category].criteria:
        count = len(c.definition.split())
        assert 10 <= count <= 25, f"{category}.{c.key}: {count} words"
        assert "\n" not in c.definition
        new_words = set(words(c.definition)) - set(words(c.label))
        assert len(new_words) >= 5, f"{category}.{c.key} only repeats its label"


def test_the_laptop_set_covers_what_a_laptop_buyer_compares() -> None:
    keys = {c.key for c in load_category_sets()["laptop"].criteria}
    assert keys == {
        "processor_speed",
        "memory_and_storage",
        "battery_life",
        "display_quality",
        "keyboard_comfort",
        "weight",
        "build_durability",
        "value_for_money",
    }
    processor = next(c for c in load_category_sets()["laptop"].criteria if c.key == "processor_speed")
    assert "heavy work" in processor.definition


def test_the_standing_desk_set_fits_a_desk_not_a_mattress() -> None:
    text = " ".join(f"{c.label} {c.definition}" for c in load_category_sets()["standing_desk"].criteria).lower()
    assert not [w for w in ("fabric", "foam", "sleep") if w in text]


def test_lookup_order_category_then_family_then_generic() -> None:
    assert fallback_criteria("laptop") == load_category_sets()["laptop"]  # its own set
    assert fallback_criteria("laptop") != family_set("laptop")
    assert fallback_criteria("tablet") == load_fallback_sets()["computing"]  # only a family set
    assert fallback_criteria("yoga_mat") == load_fallback_sets()[GENERIC_FAMILY]  # unknown category


def test_a_category_set_for_an_unknown_category_fails(tmp_path: Path) -> None:
    data = _raw()
    data["categories"]["sundial"] = data["categories"]["laptop"]  # type: ignore[index]
    with pytest.raises(CriteriaConfigError, match="sundial"):
        load_fallback_sets(_write(tmp_path, data))


def test_a_category_set_without_value_for_money_fails(tmp_path: Path) -> None:
    data = _raw()
    for row in data["categories"]["mattress"]["criteria"]:  # type: ignore[index]
        row["is_value_for_money"] = False
    with pytest.raises(CriteriaConfigError, match="value-for-money"):
        load_fallback_sets(_write(tmp_path, data))
