# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install       # install dependencies
npm run dev       # dev server with HMR at http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview production build locally
```

No test runner or linter is configured yet.

## Stack

- **Vue 3** with `<script setup>` SFCs
- **Vite 8** as bundler/dev server, configured in [vite.config.js](vite.config.js)
- `@` alias resolves to `src/`
- Vue Devtools plugin enabled in dev mode

## Structure

```
src/
  main.js          # mounts App to #app
  App.vue          # root component
  components/      # all UI components
  assets/          # global CSS (base.css, main.css) and static files
index.html         # Vite entry point
```

This is currently a fresh scaffold — `App.vue` renders the default Vue welcome screen. Replace `HelloWorld` and `TheWelcome` with actual application components as the project grows.
