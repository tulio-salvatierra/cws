# Record a published post

Use this only after the post has actually been published:

```bash
./scripts/record-published.sh instagram es "https://instagram.com/p/XXXX"
```

The supported platforms are `instagram`, `facebook`, `x`, `linkedin`,
`pinterest`, `whatsapp`, and `youtube`. Language must be `en` or `es`.
Pass the active brief version as an optional fourth argument:

```bash
./scripts/record-published.sh instagram es "https://instagram.com/p/XXXX" 3
```

## Set the secret for one terminal session

This prompt keeps the secret out of shell history and does not display it:

```bash
read -s -p "Published webhook secret: " PUBLISHED_WEBHOOK_SECRET; export PUBLISHED_WEBHOOK_SECRET; echo
```

Paste the value saved in the password manager entry
`CWS Production Published Webhook Secret`, press Return, and run the recording
command. Remove it from the session when finished:

```bash
unset PUBLISHED_WEBHOOK_SECRET
```

The script defaults `published_at` to the current time and `source` to
`manual`. It derives `external_post_id` from recognized post URLs when
possible, sends the request to Production, and prints the row ID plus whether
the row was created or already existed.
