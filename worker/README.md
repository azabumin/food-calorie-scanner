# food-calorie-scanner-api (Cloudflare Worker)

Backend proxy for the food calorie scanner app. Holds the Anthropic API key as a
Cloudflare secret (never in code), rate-limits requests to bound cost on the
shared key, and calls Claude's vision + structured-output API to turn a food
photo into a dish name / ingredient list / calorie estimate.

## One-time setup

```bash
cd worker
npm install
npx wrangler login                     # opens a browser to authorize Cloudflare
npx wrangler kv namespace create RATE_LIMIT_KV
```

The last command prints an `id`. Paste it into `wrangler.toml` under
`[[kv_namespaces]]` → `id = "..."`.

Then set the Anthropic key as a secret — **type the value yourself when prompted,
don't put it in any file**:

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

## Deploy

```bash
npx wrangler deploy
```

This prints the Worker's URL, e.g. `https://food-calorie-scanner-api.<your-subdomain>.workers.dev`.
Copy it into `../constants/config.ts` (`WORKER_URL`).

## Local dev

```bash
cp .dev.vars.example .dev.vars   # then edit .dev.vars with your own test key (gitignored)
npx wrangler dev
```

## Cost controls

Edit the constants at the top of `src/index.ts`:

- `PER_IP_DAILY_LIMIT` — max analyses per visitor per day (default 20)
- `GLOBAL_DAILY_LIMIT` — max analyses across all visitors per day (default 300),
  a hard ceiling on worst-case daily spend regardless of per-IP spoofing
- `MODEL` — defaults to `claude-haiku-4-5` (fast/cheap, good fit for this
  classification task). Switch to `claude-opus-5` for higher accuracy at
  higher cost.

Note the per-IP limit is not strong abuse protection (IPs are spoofable via
proxies) — the global daily cap is what actually bounds worst-case cost.
