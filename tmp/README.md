# tmp/ — optional data files

## Google Business categories (4000+)

Place your line-delimited export here:

```
tmp/gmb-categories.txt
```

One category name per line. Then from repo root:

```bash
node backend/scripts/build-google-categories-list.js
```

Full steps: [docs/SETUP_SMTP_AND_CATEGORIES.md](../docs/SETUP_SMTP_AND_CATEGORIES.md)
