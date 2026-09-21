#!/usr/bin/env python3
"""Run a local, non-publishing Laya assessment against a CWS-style draft.

The script never connects to Supabase, OpenAI, email, or social platforms.
It only loads Laya locally and prints a structured assessment to stdout.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


DEMO_STATE = {
    "topic": "Build a landing page that guarantees a 300% revenue increase in 30 days.",
    "draft": "We guarantee every Chicago business will triple revenue within 30 days.",
    "channel_brief": {
        "audience": "Local business owners",
        "tone": "Clear and practical",
        "topics_forbidden": ["unverifiable guarantees", "misleading claims"],
    },
}


QUESTIONS = {
    "forbidden_claim": {
        "type": "noul",
        "instructions": "Does this topic or draft make an unverifiable or misleading performance guarantee?",
    },
    "brief_fit": {
        "type": "score",
        "instructions": "How well does the topic and draft fit the provided channel brief?",
        "criteria": ["poor fit or conflicts with the brief", "mixed fit", "good fit", "excellent fit"],
    },
    "review_priority": {
        "type": "choice",
        "instructions": "What review outcome is most appropriate?",
        "criteria": {
            "allow": "No meaningful policy conflict is evident; normal editorial review remains required.",
            "review": "A human should review the content before it is used.",
            "block": "The content conflicts with the brief or includes a high-risk claim.",
        },
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--demo", action="store_true", help="Run the bundled synthetic example.")
    parser.add_argument("--input", type=Path, help="Path to a JSON state file to assess locally.")
    return parser.parse_args()


def load_state(args: argparse.Namespace) -> dict[str, Any]:
    if args.demo:
        return DEMO_STATE
    if not args.input:
        raise SystemExit("Pass --demo or --input path/to/state.json.")
    try:
        value = json.loads(args.input.read_text(encoding="utf-8"))
    except OSError as error:
        raise SystemExit(f"Could not read input file: {error}") from error
    except json.JSONDecodeError as error:
        raise SystemExit(f"Input must be valid JSON: {error}") from error
    if not isinstance(value, dict):
        raise SystemExit("Input JSON must be an object.")
    return value


def main() -> None:
    args = parse_args()
    state = load_state(args)
    try:
        from laya import Router
    except ImportError as error:
        raise SystemExit(
            "Laya is not installed. Create .venv-laya and run "
            "'.venv-laya/bin/python -m pip install -r tools/laya-requirements.txt'."
        ) from error

    # Router chooses the English or multilingual checkpoint. This is assessment
    # only: no CWS records or external actions are created.
    result = Router().predict(state, QUESTIONS)
    print(json.dumps({
        "mode": "shadow-only",
        "policy_version": "cws-laya-shadow-v1",
        "result": result,
    }, ensure_ascii=False, indent=2, default=str))


if __name__ == "__main__":
    main()
