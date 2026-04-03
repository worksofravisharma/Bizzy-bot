# Bizzy Bot

Angular **14** workspace structured like the registration widget: a reusable **library**, a **dev SPA**, and an **Angular Elements** bundle for embedding on third-party pages.

## Projects

| Project | Purpose |
|--------|---------|
| **bot-lib** | `BizzyBotComponent` (`lib-bizzy-bot`) — chat UI, forms, and styles. Built with **ng-packagr** to `dist/bot-lib`. |
| **bot-app** | Local development host: `<lib-bizzy-bot>` inside `AppComponent`. **Serve:** port `4300`. |
| **bot-element** | Registers the custom element **`lib-bizzy-bot`** via `createCustomElement` + `DoBootstrap`. Output: `dist/bot-element`. |

## Scripts

- `npm run start` / `npm run start:app` — `ng serve` **bot-app** on [http://localhost:4300](http://localhost:4300)
- `npm run start:element` — serve **bot-element** on port `4301` (element build preview)
- `npm run build:lib` — build the library package
- `npm run build:element` — production build of **bot-element** with stable chunk names, then `node build.js` → **`build/`**
- `npm run build:bundle` — run `build.js` only (expects `dist/bot-element` already built)
- `npm run test:lib` — **bot-lib** unit tests (Karma + Jasmine, Chrome Headless, single run)
- `ng test --project=bot-lib` — same tests in watch mode (default browser: Chrome)

## Unit tests (bot-lib)

Specs live under `projects/bot-lib/src/lib/**`. They cover widget **config merge/parse** and **BizzyBotComponent** (welcome message, theme CSS variables, `widgets` toggles, send/reload, feedback, file-upload helpers).

## Embed (host page)

The element tag is **`lib-bizzy-bot`**. Optional string config: **`config`** attribute (bound to `@Input() config` on `BizzyBotComponent`).

**Async loader (recommended):**

```html
<script src="https://your-cdn.example/bizzy-bot/widget-loader.js" data-widget-base-url="https://your-cdn.example/bizzy-bot/" async></script>
<lib-bizzy-bot></lib-bizzy-bot>
```

`build/` contains `runtime.js`, `polyfills.js`, `vendor.js`, `main.js`, `styles.css`, the concatenated **`bot-element.js`**, `index.html`, and `widget-loader.js`.

## Stack notes

- **Font Awesome** is loaded from a CDN in **bot-app** and **bot-element** `index.html`; keep the same on host pages when embedding.
- Library and apps import **source** from `projects/bot-lib` (same pattern as the in-repo registration **widget-element** → **widget-lib** path).

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) 14.2.x.
