# PNG source archive

HEAD-ON keeps authored PNG originals in Git, but production and static preview delivery are WebP-first.

## Duplicate cleanup policy

- A PNG under `dist/src-png/` is removed only when its Git blob SHA is exactly identical to the canonical PNG at `dist/<same relative path>`.
- Unique or differing PNG source files remain untouched in `dist/src-png/`.
- Every removed duplicate is recorded in `duplicate-png-index.json` with its old path, canonical path, byte size, and exact Git blob SHA.
- The complete tree from before this cleanup is permanently referenced by branch `archive/png-sources-pre-dedupe-20260927` at commit `9c8ad7d4531775b6931c06673373ffa91b3ee2eb`.

This means the original bytes remain recoverable even if the canonical file is changed later.

Example recovery:

```bash
git show archive/png-sources-pre-dedupe-20260927:dist/src-png/<filename>.png > <filename>.png
```

The deploy/build pipeline must not publish `dist/src-png/`.
