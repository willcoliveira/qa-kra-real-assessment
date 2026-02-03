# Bug Findings

This document tracks bugs and issues discovered during test development and execution.

---

## Template

```markdown
## BUG-XXX: [Title]

- **Severity:** High/Medium/Low
- **Component:** [Component name]
- **Steps to reproduce:**
  1. Step 1
  2. Step 2
  3. ...
- **Expected result:** What should happen
- **Actual result:** What actually happens
- **Test file:** (if test is skipped due to bug)
- **Screenshots:** (if available)
- **Notes:** Additional context
```

---

## Discovered Issues

### BUG-001: Newly created article tags do not appear in Popular Tags sidebar

- **Severity:** Medium
- **Component:** Home Page - Popular Tags Sidebar
- **Steps to reproduce:**
  1. Login to the application
  2. Create a new article with a unique tag (e.g., "my-new-unique-tag")
  3. Navigate to the Home page
  4. Look at the "Popular Tags" sidebar on the right side
- **Expected result:** The newly created tag should appear in the Popular Tags sidebar, allowing users to filter articles by that tag
- **Actual result:** The newly created tag does not appear in the Popular Tags sidebar. Only previously existing "popular" tags are shown. There is no way to filter articles by a newly created tag from the sidebar.
- **Test file:** `tests/tags.spec.ts` - Tests were modified to use existing popular tags as a workaround
- **Screenshots:** See `test-results/tags-Tag-Filter-*` screenshots showing the Popular Tags sidebar without newly created tags
- **Notes:**
  - The sidebar is labeled "Popular Tags" which suggests there may be a threshold or algorithm determining which tags are shown
  - However, this creates a poor UX where users cannot immediately filter by tags they just created
  - Possible causes:
    1. Tags require multiple uses before appearing as "popular"
    2. There's a caching layer that delays tag appearance
    3. The API endpoint for popular tags has a minimum threshold
  - **Workaround:** Tests use existing tags from the Popular Tags sidebar instead of newly created tags
  - **Recommendation:** Either show all tags (with popular ones highlighted), or add a "Recently Used Tags" section, or allow tag filtering from the article preview directly

---

### BUG-002: TagList validation error displays "[object Object]" instead of actual error message

- **Severity:** Medium
- **Component:** Article Editor - Error Message Display
- **Steps to reproduce:**
  1. Login to the application
  2. Navigate to New Article editor (`/#/editor`)
  3. Enter a tag with more than 120 characters
  4. Fill other required fields (title, description, body)
  5. Click "Publish Article"
- **Expected result:** Error message should display: "Taglist: Ensure this field has no more than 120 characters."
- **Actual result:** Error message displays: "Taglist: [object Object]"
- **API Response:**
  ```json
  {
    "errors": {
      "tagList": {
        "0": ["Ensure this field has no more than 120 characters."]
      }
    }
  }
  ```
- **Test file:** `tests/article.spec.ts` - Validation tests added with bug reference
- **Screenshots:** See attached screenshot showing "[object Object]" error
- **Notes:**
  - The API returns a nested object for tagList errors (indexed by tag position)
  - The frontend error message component doesn't properly parse nested error objects
  - This is a UI bug - the API response is correct but the frontend doesn't handle it properly
  - **Root cause:** The error display component likely uses `String()` or template literal on the error value without checking if it's an object
  - **Recommendation:** Update the error message component to recursively flatten nested error objects or handle array-indexed errors

---

### BUG-004: Article preview text overflows container in Global Feed when at character limits

- **Severity:** Medium
- **Component:** Home Page - Article Preview / Global Feed
- **Steps to reproduce:**
  1. Login to the application
  2. Create an article with title at max limit (120 characters)
  3. Create an article with description at max limit (255 characters)
  4. Navigate to Home page and view Global Feed
- **Expected result:** Article titles and descriptions should:
  - Truncate with ellipsis (...) when too long
  - Stay within their container boundaries
  - Not overlap with other elements (like Popular Tags sidebar)
- **Actual result:** Long titles and descriptions overflow their containers, breaking the page layout and overlapping with the Popular Tags sidebar
- **Test file:** N/A - Visual/CSS issue
- **Screenshots:** See attached screenshot showing text overflow in Global Feed
- **Notes:**
  - The API accepts titles up to 120 characters and descriptions up to 255 characters
  - The UI doesn't properly handle these maximum lengths
  - Affects both article title (h1) and description text in article previews
  - **Root cause:** Missing CSS properties for text truncation
  - **Recommendation:** Add CSS rules to article preview elements:
    ```css
    .article-preview h1,
    .article-preview p {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap; /* or use -webkit-line-clamp for multi-line */
    }
    ```

---

### BUG-005: Insufficient success feedback after article creation - user stays on editor

- **Severity:** Medium
- **Component:** Article Editor - Success Feedback / Navigation
- **Steps to reproduce:**
  1. Login to the application
  2. Navigate to New Article editor (`/#/editor`)
  3. Fill in all required fields (title, description, body)
  4. Click "Publish Article"
  5. Observe the page behavior
- **Expected result:**
  - User should be redirected to the newly created article page, OR
  - Clear, prominent success notification with link to the article
- **Actual result:**
  - API returns 201 Created (success)
  - A small success message appears briefly in the form
  - User remains on the editor page (form clears for a new article)
  - No navigation to the created article
  - No link provided to view the published article
- **API Response:** `201 Created` with article data
  ```json
  {
    "article": {
      "title": "test",
      "description": "test",
      "body": "test",
      "tagList": ["test"]
    }
  }
  ```
- **Test file:** `tests/article.spec.ts` - Tests verify success message appears, then navigate to profile to confirm article
- **Notes:**
  - The success message element (`.success-messages`) does appear but is not prominent
  - User is left on the editor without easy access to their new article
  - Common UX patterns for article publishing:
    1. Redirect to the new article page (most common)
    2. Show modal with "View Article" button
    3. Display prominent toast with link
  - **Current behavior:** Success message shown but user must manually navigate to find their article
  - **Recommendation:** Redirect to the article page after successful publish (standard blog behavior)

---

### BUG-003: Long tag text breaks UI layout - CSS overflow issue

- **Severity:** Low
- **Component:** Article Editor - Tag Pill Display
- **Steps to reproduce:**
  1. Login to the application
  2. Navigate to New Article editor (`/#/editor`)
  3. Enter a very long tag (e.g., 200+ characters)
  4. Observe the tag pill display below the tag input
- **Expected result:** Long tags should either:
  - Truncate with ellipsis (...)
  - Wrap within the container
  - Be limited by input validation
- **Actual result:** The tag pill extends beyond the container boundaries, breaking the page layout
- **Test file:** `tests/article.spec.ts` - CSS validation test added with bug reference
- **Screenshots:** See attached screenshot showing tag overflow
- **Notes:**
  - The `.tag-pill` CSS class is missing `overflow: hidden`, `text-overflow: ellipsis`, or `max-width` properties
  - This affects both the editor page and potentially article display pages
  - **Recommendation:** Add CSS rules to `.tag-pill`:
    ```css
    .tag-pill {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ```

---

### BUG-006: Logout button misaligned with Update Settings button on Settings page

- **Severity:** Low
- **Component:** Settings Page - Button Alignment
- **Steps to reproduce:**
  1. Login to the application
  2. Navigate to Settings page (`/#/settings`)
  3. Observe the button alignment at the bottom of the form
- **Expected result:** The "Or click here to logout." button should be aligned consistently with the "Update Settings" button (either both centered, both right-aligned, or both full-width)
- **Actual result:** The "Update Settings" button is right-aligned while the "Or click here to logout." button is left-aligned, creating visual inconsistency
- **Test file:** N/A - Visual/CSS issue
- **Notes:**
  - The "Update Settings" button uses `pull-xs-right` class for right alignment
  - The logout button is in a separate row without alignment styling
  - **Recommendation:** Align both buttons consistently

---

### BUG-007: Comments do not appear immediately after posting - requires page reload

- **Severity:** Medium
- **Component:** Article Page - Comments Section
- **Steps to reproduce:**
  1. Login to the application
  2. Navigate to any article
  3. Enter a comment in the comment textarea
  4. Click "Post Comment"
  5. Observe the comments section
- **Expected result:** The newly posted comment should appear immediately in the comments list without requiring any additional user action
- **Actual result:** The comment is successfully saved (API returns 200), but the comment does not appear in the UI until the page is manually refreshed
- **API Response:** `200 OK` with comment data
- **Test file:** `tests/comments.spec.ts` - Tests use page reload as workaround
- **Notes:**
  - The API call succeeds and the comment is persisted in the database
  - The issue is that the frontend does not update the comments list after a successful POST
  - This is particularly noticeable in containerized/CI environments where timing is more sensitive
  - **Workaround:** Tests reload the page after posting a comment to ensure the comment appears
  - **Root cause:** The Angular component likely doesn't re-fetch the comments list or update the local state after posting
  - **Recommendation:** After successful comment POST, either:
    1. Re-fetch the comments list from the API
    2. Optimistically add the new comment to the local state
    3. Use WebSocket/real-time updates for comments

---

## Notes

When a bug is found that prevents a test from passing:

1. Document the bug in this file using the template above
2. In the test file, use `test.skip()` with a reference to the bug:

```typescript
// Bug - BUG-001: Description of the issue
test.skip('should be able to do something', async () => {
  // test code
});
```

3. Once the bug is fixed, remove the `test.skip()` and verify the test passes
