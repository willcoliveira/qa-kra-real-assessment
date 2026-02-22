# Test Planning Skill — qa-kra-real-assessment

## Overview

Use this guide when planning new E2E tests. Follow the exploration workflow below to understand the application before writing tests.

---

## Exploring Pages with Playwright CLI

Before writing tests, use `playwright-cli` to explore the application interactively:

```bash
# Open the application
playwright-cli open http://localhost:4200 --headed

# Take a snapshot to see page structure
playwright-cli snapshot

# Navigate and interact
playwright-cli click e5
playwright-cli fill e3 "test input"

# Inspect specific areas
playwright-cli snapshot --selector "[data-testid='form']"
```

The CLI gives you real-time visibility into page structure, available selectors, and element states.

---

## Application Flow Phases

```
1. Home Page (#/)           → Global feed, Your feed, popular tags
2. Register (#/register)    → Create new account
3. Login (#/login)          → Authenticate existing user
4. Editor (#/editor)        → Create/edit articles (title, description, body, tags)
5. Article (#/article/slug) → View article, comments, favorite, follow author
6. Profile (#/profile/user) → My Articles, Favorited Articles, user bio
7. Settings (#/settings)    → Update profile, change password, logout
```

**Note:** App uses Angular hash routing (`#/path`). All navigation uses `BasePage.navigate()` which prepends `#` automatically.

---

## Test Plan Template

When planning a new test, document:

### 1. Test Objective
- What user journey is being tested?
- Which acceptance criteria does it verify?

### 2. Environment & Configuration
- Which environment? (staging, dev, etc.)
- Which viewport? (desktop, mobile)
- Which configuration variant?

### 3. Flow Steps
Map each step to a page object:

- `registerPage` → `navigate()`, `register(username, email, password)`
- `loginPage` → `navigate()`, `login(email, password)`, `fillEmail()`, `fillPassword()`, `clickSignIn()`
- `homePage` → `navigate()`, `clickGlobalFeed()`, `waitForArticlesLoaded()`, `getArticleTitles()`
- `editorPage` → `navigate()`, `createArticle(title, desc, body, tags)`, `fillTitle()`, `fillBody()`, `clickPublish()`
- `articlePage` → `waitForArticleLoaded()`, `getTitle()`, `getBody()`, `clickEdit()`, `clickDelete()`
- `profilePage` → `navigate(username)`, `waitForProfileLoaded()`, `getMyArticles()`, `clickArticleByTitle()`
- `settingsPage` → `navigate()`, `waitForSettingsLoaded()`, `clickLogout()`

### 4. Authentication
- Does the test need a logged-in user? → Use auth fixture or setup
- Does it need a guest user? → Skip login flow
- Does it need specific user attributes? → Use data factory with overrides

### 5. Teardown
- Does the test create data that needs cleanup? → Add `afterEach` hook
- Does it reserve resources? → Ensure release in teardown

### 6. Tags
Apply appropriate tags for CI filtering:

- `@auth` — Authentication flows (register, login, logout) — runs in `unauthenticated` project
- `@articles` — Article CRUD and validation — runs in `authenticated` project
- `@comments` — Comment interactions — runs in `authenticated` project
- `@feed` — Follow/feed functionality — runs in `authenticated` project
- `@tags` — Tags feature — runs in `authenticated` project

---

## Planning Checklist

- [ ] Identified the application flow phases involved
- [ ] Selected the appropriate environment and configuration
- [ ] Determined authentication needs
- [ ] Planned teardown strategy
- [ ] Assigned appropriate tags
- [ ] Checked source application for selectors and component behavior
- [ ] Verified the test doesn't duplicate existing coverage
- [ ] Explored the page with playwright-cli to validate selectors
