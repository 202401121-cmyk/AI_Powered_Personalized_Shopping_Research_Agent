"""Run one whole search from the terminal (US-52).

    python -m app.cli "best laptop for coding under 70k"

Answers the first interview question with "medium", runs the search pipeline and prints the shortlist.
"""

from __future__ import annotations

import argparse
import io
import sys

from app.contracts import InterviewState, InterviewTurn, SearchRequest, SearchResult, Source
from app.pipeline import InMemoryResultStore, PipelineRunner, default_search_stages
from app.presearch import interview_turn, make_criteria, start_request

CLI_SESSION_ID = "sess_cli0001"
CLI_REPLY = "medium"
SOURCES_PER_PRODUCT = 2


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli", description="Run one ShopSense search.")
    parser.add_argument("query", help='what you want, e.g. "best laptop for coding under 70k"')
    query: str = parser.parse_args(argv).query

    intent = start_request(query)
    if not intent.ready_for_research:
        print(intent.clarification_question or "Please say what kind of product you want.")
        return 1

    state = InterviewState(session_id=CLI_SESSION_ID, intent=intent, criteria=make_criteria(intent))
    step = interview_turn(InterviewTurn(state=state))
    if step.question is not None:
        print(f"Q: {step.message}")
        print(f"A: {CLI_REPLY}")
        step = interview_turn(InterviewTurn(state=step.state, reply_text=CLI_REPLY))
    if step.rubric is None:
        print("The interview did not finish, so there is nothing to search yet.")
        return 1

    request = SearchRequest(session_id=CLI_SESSION_ID, raw_query=query, rubric=step.rubric)
    result = PipelineRunner(default_search_stages(), InMemoryResultStore()).run(request)
    print(render(result))
    return 0


def render(result: SearchResult) -> str:
    """The shortlist as plain text."""
    names = {p.product.id: p.product.name for p in result.products}
    lines = [f"\nResults for: {result.request.raw_query}"]

    ranked = result.decision.ranked if result.decision else []
    lines.append("\nRanked:" if ranked else "\nNo product passed your rules.")
    for r in ranked:
        name = names.get(r.product_id, r.product_id)
        chance = f"{r.chance_first:.0%}" if r.chance_first is not None else "n/a"
        lines.append(
            f"  {r.rank}. {name}: score {r.score:.1f}, coverage {r.coverage:.0%}, chance of being first {chance}"
        )
        for url in top_sources(result, r.product_id):
            lines.append(f"       source: {url}")

    filtered = result.decision.filtered if result.decision else []
    for group, title in (("filtered_out", "Filtered out"), ("cant_tell", "Can't tell")):
        rows = [f for f in filtered if f.group == group]
        if rows:
            lines.append(f"\n{title}:")
            lines += [f"  - {names.get(f.product_id, f.product_id)}: {'; '.join(f.reasons)}" for f in rows]

    if result.coverage_note:
        lines.append(f"\nCoverage note: {result.coverage_note}")
    if not result.saved:
        lines.append("\nThis search could not be saved.")
    return "\n".join(lines)


def top_sources(result: SearchResult, product_id: str) -> list[str]:
    """URLs of the sources that name the product, most authoritative first."""
    summary = next((p for p in result.products if p.product.id == product_id), None)
    if summary is None:
        return []
    names = [n.lower() for n in [summary.product.name, *summary.product.aliases]]

    def names_it(source: Source) -> bool:
        text = f"{source.title} {source.text}".lower()
        return any(n in text for n in names)

    matching = sorted((s for s in result.sources if names_it(s)), key=lambda s: s.tier)
    return [str(s.url) for s in matching[:SOURCES_PER_PRODUCT]]


if __name__ == "__main__":
    # A Windows console may not be able to show the ₹ sign; print a '?' rather than crash.
    if isinstance(sys.stdout, io.TextIOWrapper):
        sys.stdout.reconfigure(errors="replace")
    sys.exit(main())
