# Releasing

Releases are published to npm by GitHub Actions when a `v*` tag is pushed.

## Day to day

1. Branch from `main` and commit using [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, ...).
2. Open a PR. CI runs the format check, build, tests, and a smoke test that installs the packed tarball and runs the CLI, on Node 22 and 24.
3. Merge once CI is green. Nothing is published until a tag is pushed.

## Cutting a release

```bash
git checkout main && git pull
npm version patch   # fixes only        (1.6.0 → 1.6.1)
# npm version minor # any feat: commits (1.6.x → 1.7.0)
# npm version major # breaking changes  (→ 2.0.0)
git push --follow-tags
```

`npm version` bumps `package.json` and `package-lock.json`, commits, and creates the `vX.Y.Z` tag. Pushing the tag runs `.github/workflows/release.yml`, which:

1. Runs CI against the tagged commit.
2. Checks that the tag matches the `package.json` version.
3. Runs `npm publish` (tests and build run again via `prepublishOnly`), using npm trusted publishing with provenance. No npm token is stored in the repo.
4. Creates a GitHub Release with auto-generated notes.

Then check it:

```bash
npm view @j0srisk/typeflow version
npx @j0srisk/typeflow@latest --version
```

## When something goes wrong

- **The workflow fails before publishing:** fix it on a branch and merge, then either delete and recreate the tag (`git tag -d vX.Y.Z && git push origin :vX.Y.Z`) or release the next patch version.
- **A broken version reached npm:** don't unpublish. Deprecate it and release a fix:
  `npm deprecate @j0srisk/typeflow@X.Y.Z "broken, use X.Y.Z+1"`

## One-time setup

- On npmjs.com → `@j0srisk/typeflow` → Settings → Trusted publishing, add GitHub Actions with repository `j0srisk/Typeflow`, workflow `release.yml` and environment `npm`.
