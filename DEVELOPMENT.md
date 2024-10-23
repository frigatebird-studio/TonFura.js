# Development Guide

This repository uses `pnpm` and `nx` as its build system. Unless mentioned, all
commands assume your working directory to be the project root.

To install dependencies: `pnpm i && pnpm i -C packages/{core/adapter}`

To build: `npx nx build {core,adapter}`

To test locally via Verdaccio:

1. Execute `pnpm set registry http://localhost:4873/ --location project`.
2. Run a local npm registry: `nx local-registry`.
3. If you have fetched dependencies at least once, the package metadata may linger in the cache and publishing may fail with `409 Conflict`. The solution is to `pnpm unpublish PKG@VERSION` it first.
4. Remember to revert the change in `.npmrc` after testing.

# Publishing

Make sure the repository is clean and use `nx` to publish:

1. Bump the version of the package you would like to publish.
2. Run the build command.
3. Run `nx run PKG:nx-release-publish` where `PKG` is the specific package. \
   **FIXME**: Running `nx-release-publish` directly [is not recommended](https://nx.dev/nx-api/js/executors/release-publish).
