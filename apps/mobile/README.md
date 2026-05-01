# NovelQuick Mobile

A thin Tauri 2 shell that points at the deployed `apps/web` URL.

## Configure

The web URL the shell loads is resolved in this order:
1. Runtime env `NOVELQUICK_WEB_URL`
2. Compile-time env `NOVELQUICK_WEB_URL` (set when `cargo` builds)
3. The default in `src-tauri/src/lib.rs`

## Dev

```bash
# desktop preview (loads localhost:3000 by default)
pnpm --filter mobile desktop:dev

# android (requires Android SDK + NDK)
pnpm --filter mobile android:dev

# ios (requires Xcode)
pnpm --filter mobile ios:dev
```

## Build

```bash
NOVELQUICK_WEB_URL=https://your.domain pnpm --filter mobile android:build
NOVELQUICK_WEB_URL=https://your.domain pnpm --filter mobile ios:build
```
