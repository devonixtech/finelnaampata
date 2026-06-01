# Google Business Categories — Client Review

## Files

| File | Purpose |
|------|---------|
| `categories-list.json` (repo root) | Master list imported via admin API |
| `tmp/gmb-categories.txt` | Optional: paste a line-delimited 4000+ export here |
| `backend/scripts/build-google-categories-list.js` | Rebuilds `categories-list.json` from txt or Places seed |

## Workflow

1. **Review current list:** `GET /api/v1/categories/review-export`
2. **Amend** `categories-list.json` (or rebuild from your txt file).
3. **Import:** `POST /api/v1/categories/admin/bulk-import-file` (admin JWT).

## Full 4000+ sync (optional)

Set `GOOGLE_BUSINESS_ACCESS_TOKEN` and call:

`POST /api/v1/categories/admin/sync-google-business-profile`

This paginates the Google Business Profile Categories API and can write a review file when `writeReviewFile: true`.
