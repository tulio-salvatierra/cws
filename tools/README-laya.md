# Local Laya shadow evaluator

This is a local experimentation tool. It never calls Supabase, OpenAI, email,
or publishing APIs, and it never creates CWS records.

## Run the safe synthetic demo

```bash
HF_HOME="$PWD/.laya-cache" .venv-laya/bin/python tools/laya-shadow.py --demo
```

The first inference downloads the public model checkpoint into the ignored
`.laya-cache/` directory. It is a large download and can take several minutes.
No Hugging Face token is required for the public checkpoint, though an optional
`HF_TOKEN` may avoid anonymous rate limits.

## Assess your own local JSON file

Create a local file that contains only non-sensitive sample content:

```json
{
  "topic": "Five website copy improvements for a Chicago service business",
  "draft": "Clear pricing and a focused call to action help visitors take the next step.",
  "channel_brief": {
    "audience": "Local business owners",
    "tone": "Clear and practical",
    "topics_forbidden": ["unverifiable guarantees", "misleading claims"]
  }
}
```

Then run:

```bash
HF_HOME="$PWD/.laya-cache" .venv-laya/bin/python tools/laya-shadow.py --input /absolute/path/to/sample.json
```

The output is JSON containing Laya's raw decision result under a CWS policy
version. Treat it as an experiment: it has no authority to block, publish, or
send anything.

## Run the local service with CWS

In one terminal, start the private loopback-only service:

```bash
cd /Users/tuliosalvatierra/CWS
export LAYA_SERVICE_TOKEN='choose-a-long-random-local-secret'
HF_HOME="$PWD/.laya-cache" .venv-laya/bin/python tools/laya-service.py
```

In the untracked `.env` used by `npm run dev`, add the same values:

```text
LAYA_SERVICE_URL=http://127.0.0.1:8765/assess
LAYA_SERVICE_TOKEN=17499954

```

Then run CWS normally with `npm run dev` and generate a review draft from the
Agent Runs page. The existing run output gains an advisory `laya` field. If
the service is stopped or not configured, generation still succeeds and the
run records an unavailable/not-configured assessment instead.
