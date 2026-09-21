#!/usr/bin/env python3
"""Private local HTTP service for CWS's advisory-only Laya assessment."""

from __future__ import annotations

import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from laya import Router


POLICY_VERSION = "cws-laya-shadow-v1"
MAX_TEXT_LENGTH = 20_000
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


def configured_token() -> str:
    token = os.environ.get("LAYA_SERVICE_TOKEN", "").strip()
    if not token:
        raise RuntimeError("Set LAYA_SERVICE_TOKEN before starting the service.")
    return token


def validate_state(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("state must be an object.")
    for key in ("topic", "draft"):
        if not isinstance(value.get(key), str) or not value[key].strip():
            raise ValueError(f"state.{key} must be a non-empty string.")
        if len(value[key]) > MAX_TEXT_LENGTH:
            raise ValueError(f"state.{key} exceeds {MAX_TEXT_LENGTH} characters.")
    if not isinstance(value.get("channel_brief"), dict):
        raise ValueError("state.channel_brief must be an object.")
    return value


class AssessmentHandler(BaseHTTPRequestHandler):
    router = Router()
    token = configured_token()

    def do_POST(self) -> None:
        if self.path != "/assess":
            self.respond(HTTPStatus.NOT_FOUND, {"error": "Not found."})
            return
        if self.headers.get("Authorization") != f"Bearer {self.token}":
            self.respond(HTTPStatus.UNAUTHORIZED, {"error": "Unauthorized."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 100_000:
                raise ValueError("Request body must be between 1 and 100000 bytes.")
            body = json.loads(self.rfile.read(length))
            if body.get("policy_version") != POLICY_VERSION:
                raise ValueError("Unsupported policy version.")
            state = validate_state(body.get("state"))
            result = self.router.predict(state, QUESTIONS)
            self.respond(HTTPStatus.OK, {
                "mode": "shadow-only",
                "policy_version": POLICY_VERSION,
                "result": result,
            })
        except (ValueError, json.JSONDecodeError) as error:
            self.respond(HTTPStatus.BAD_REQUEST, {"error": str(error)})
        except Exception:
            self.respond(HTTPStatus.SERVICE_UNAVAILABLE, {"error": "Laya assessment unavailable."})

    def do_GET(self) -> None:
        if self.path == "/health":
            self.respond(HTTPStatus.OK, {"ok": True, "mode": "shadow-only", "policy_version": POLICY_VERSION})
            return
        self.respond(HTTPStatus.NOT_FOUND, {"error": "Not found."})

    def respond(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        content = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, _format: str, *_args: Any) -> None:
        return


def main() -> None:
    port = int(os.environ.get("LAYA_SERVICE_PORT", "8765"))
    server = ThreadingHTTPServer(("127.0.0.1", port), AssessmentHandler)
    print(f"Laya shadow service listening on http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
