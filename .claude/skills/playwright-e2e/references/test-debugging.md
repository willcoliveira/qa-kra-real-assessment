# Test Debugging Skill — qa-kra-real-assessment

## Common Failure Patterns

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| `Timeout waiting for selector` | Element not yet rendered or selector changed | Check selector against current DOM; increase timeout |
| Test passes locally but fails on CI | Headless differences, timing, or missing env vars | CI uses fewer workers and retries; check env var presence in CI secrets |
| Element not clickable / intercepted | Another element overlapping or not yet hidden | Wait for overlay/loader to disappear; check z-index issues |
| `page.goto()` timeout | Page too slow to load or URL incorrect | Check base URL; wait for specific element instead of full load |
| Session/auth errors | Storage state expired (30-min TTL) or `jwtToken` missing from localStorage | Delete `storage/auth-*.json` files and re-run; check `auth.helper.ts` |
| Flaky assertion on dynamic content | Content updates asynchronously | Use `toPass()` or `expect.poll()` instead of single assertion |
| Hash routing mismatch | Navigation used `/path` instead of `#/path` | Use `BasePage.navigate()` which auto-prepends `#`; use `waitForURL(/.*#\/path/)` |
| Angular `formcontrolname` selector fails | Form control name changed in app | Check Angular source for updated `formcontrolname` values |
| Docker app not running | Tests fail immediately with connection refused | Run `make app-up` to start the Django + Angular stack |
| `[object Object]` in error message | Known BUG-002: TagList validation error | App bug — do NOT fix the test; this is documented in `article.spec.ts` |

---

## Debugging Workflow

### 1. Read the Error Message

Playwright error messages include:
- **Selector** that failed to match
- **Timeout** that was exceeded
- **Expected vs actual** state

### 2. Inspect Page State with Playwright CLI

```bash
# Take a snapshot to see current DOM state
playwright-cli snapshot

# Check for specific elements
playwright-cli snapshot --selector "[data-testid='form']"

# Look for iframes
playwright-cli snapshot --selector "iframe"
```

### 3. Use Trace Viewer

```bash
# Open trace file from test-reports
npx playwright show-trace test-reports/*/trace.zip

# Or use online viewer
# Upload trace.zip to trace.playwright.dev
```

Trace viewer shows:
- Screenshot at each step
- Network requests/responses
- Console output
- DOM snapshots
- Action log with timing

### 4. Check CI Reports

CI generates HTML reports as artifacts:
- Download from the CI artifacts section
- Open `index.html` in a browser
- Reports include screenshots on failure

---

## Root Cause Classification

When a test fails, classify the root cause before attempting a fix:

| Category | Description | Fix Strategy |
|----------|-------------|-------------|
| LOCATOR_CHANGED | Element selector no longer matches DOM | Update selector from page inspection or source repo |
| NEW_PREREQUISITE | App now requires an interaction the test skips | Add the missing step using existing POM methods |
| ELEMENT_REMOVED | UI element was removed or replaced | Remove test step or use replacement element |
| TIMING_ISSUE | Race condition or insufficient wait | Add web-first assertion (`toBeVisible()`) or `waitForURL()` |
| DATA_CHANGED | Expected values no longer match (text, counts, prices) | Update assertion expected values |
| NAVIGATION_CHANGED | Routes or page flow restructured | Update `goto()` URLs and `waitForURL()` patterns |
| APPLICATION_BUG | The app itself is broken — test correctly caught a real defect | Do NOT fix the test — report the bug |

---

## App Bug vs Test Bug — Decision Tree

Before modifying a failing test, determine whether it's a test issue or an application bug:

1. **Would a real user hit this same failure?** If a human followed the exact same steps manually and encountered the same broken behavior → **APPLICATION BUG**
2. **Check the evidence:**
   - API returning 4xx/5xx that previously returned 2xx → likely app bug
   - Console shows unhandled exceptions in app code → likely app bug
   - UI shows error state despite correct inputs → likely app bug
   - Selector doesn't match but element exists with different attributes → test bug (LOCATOR_CHANGED)
   - Test skips a required interaction (new modal, new field) → test bug (NEW_PREREQUISITE)

### When it IS an app bug:
- Do NOT modify the test
- Do NOT add `test.skip()` or `test.fixme()`
- Leave the test failing so CI keeps flagging the issue
- Report using the bug report template below

### Bug Report Template

> **Title:** [BUG] {concise description}
> **Environment:** {browser, base URL, environment}
>
> **Steps to Reproduce (manual):**
> 1. Navigate to {URL}
> 2. {step as manual user action}
> 3. ...
>
> **Expected:** {what should happen}
> **Actual:** {what happens instead}
>
> **Technical Evidence:**
> - Failing endpoint: `{METHOD} {URL}` → {status}
> - Console errors: `{messages}`
> - Test file: `{file path}:{line number}`

---

## Environment Variable Issues

If tests fail immediately with credential errors, verify all required env vars are set:

```
Required env vars:
BASE_URL       — Application base URL (default: http://localhost:4200)
BROWSER        — Browser to use: chromium, firefox, webkit (default: chromium)
CI             — Set to any value to enable CI mode (2 workers, 2 retries, trace off)
```

Config-based values (loaded from `config/settings.yaml`):
- `baseUrl` — App URL (overridable via `BASE_URL` env var)
- `apiUrl` — Backend API URL (default: http://localhost:8000/api)
- `accounts.userA/userB` — Static test accounts (email, password, username)

Check `.env` file locally or CI secrets for your CI platform.
