# Gitpulse

A GitHub profile search app built with Vite and React. Enter any GitHub username and instantly view
their profile details, stats, and recent repositories.

[https://farzanuddin.github.io/gitpulse](https://farzanuddin.github.io/gitpulse/)

![preview](./.github/assets/screen-recording.gif)

## Features

- **Username search** — look up any GitHub user and fetch their public profile data
- **Autocomplete suggestions** — debounced live username suggestions with keyboard navigation while
  typing
- **Profile overview** — avatar, name, bio, join date, and direct GitHub profile link
- **Public stats** — repository count, followers, and following
- **Contact fields** — location, company, and website when available
- **Recent repositories** — shows 3 most recently pushed non-fork repos
- **Caching** — in-memory LRU cache with TTL minimizes redundant API calls; cached results are
  indicated via a badge
- **Error handling** — user-friendly error messages for network issues, rate limits, and missing
  users with a shake animation
- **Graceful crash recovery** — an Error Boundary catches runtime errors with a reload button

## Tech Stack

| Technology                                                   | Version | Role                               |
| ------------------------------------------------------------ | :-----: | ---------------------------------- |
| [React](https://react.dev/)                                  | ^18.2.0 | UI framework                       |
| [Vite](https://vitejs.dev/)                                  | ^5.4.21 | Build tool & dev server            |
| [Tailwind CSS v4](https://tailwindcss.com/)                  | ^4.3.0  | Utility-first CSS framework        |
| [Radix UI Avatar](https://www.radix-ui.com/)                 | ^1.1.11 | Accessible avatar primitive        |
| [Radix UI Slot](https://www.radix-ui.com/)                   | ^1.2.4  | Polymorphic component primitive    |
| [class-variance-authority](https://cva.style/)               | ^0.7.1  | Component variant management       |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge)  | ^3.6.0  | Intelligent Tailwind class merging |
| [tw-animate-css](https://github.com/yurkimus/tw-animate-css) | ^1.4.0  | Tailwind animation utilities       |
| [PropTypes](https://github.com/facebook/prop-types)          | ^15.8.1 | Runtime prop type checking         |
| [ESLint](https://eslint.org/)                                | ^8.45.0 | Code linting                       |
| [Prettier](https://prettier.io/)                             | ^3.8.1  | Code formatter                     |
| [gh-pages](https://github.com/tschaub/gh-pages)              | ^5.0.0  | GitHub Pages deployment            |

## Architecture

### Component Tree

```
<ErrorBoundary>
  <App>
    <Header />           ← cache/warning status badges
    <Search>             ← owns the search hook
      <Input />          ← text input
      <Button />         ← submit button
      <Display />        ← lazy-loaded profile card
        <Avatar />
        <Badge />
        <Button />
      <FooterCredit />
    </Search>
  </App>
</ErrorBoundary>
```

### Key Decisions

| Area                     | Approach                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **State & side effects** | Custom hook (`useGithubUserSearch`) owns all search/suggestion/caching logic — UI components are purely presentational               |
| **Caching**              | In-memory LRU-style cache with 15-minute TTL, separate caches for user data and autocomplete suggestions                             |
| **Request management**   | `AbortController` per request type with request-ID tracking prevents stale responses and race conditions                             |
| **Autocomplete**         | 240ms debounce, separate `AbortController`, dedicated cache, disabled on rate-limit detection                                        |
| **Styling**              | Tailwind CSS v4 with a custom `@theme` color palette; reusable UI primitives (`Button`, `Input`, `Badge`, `Avatar`) built with `cva` |
| **Code splitting**       | `Display` profile card is lazy-loaded via `React.lazy` + `Suspense`; preloaded on search form focus                                  |
| **Error handling**       | `ErrorBoundary` catches render crashes; API errors map to user-friendly messages (network, rate-limit, not-found)                    |
| **Data fetching**        | Shared `githubApi.js` utility wraps all GitHub API calls with consistent auth headers and error handling                             |
| **Date formatting**      | Custom `formatDate.js` (no date library dependency)                                                                                  |
| **Icons**                | Inline SVG components (no icon library dependency)                                                                                   |

### Optimizations Applied

- Code-split `Display` into a lazy-loaded chunk (8.8 KB vs 16.7 KB before)
- Removed `lucide-react`, `dayjs`, `clsx`, `@testing-library/react`, `@testing-library/user-event`,
  `vitest`, and `jsdom` dependencies
- Deduplicated API fetching logic into a shared client
- Stabilized `onStatusChange` callback via `useRef` to prevent unnecessary effect re-runs
- Lazy image loading on suggestion avatars
- Default user search checks cache before calling the API
- Stripped unused CSS custom properties (`--chart-*`, `--ring`, `--overlay`)
- Header renders nothing when there are no status updates (instead of `visibility: hidden`)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Add a GitHub personal access token to raise the API rate limit from 60 to 5,000
   requests/hour:

   ```bash
   cp .env.example .env.local
   ```

   Open `.env.local` and replace `your_token_here` with a token from
   [github.com/settings/tokens](https://github.com/settings/tokens) — no scopes required. The app
   works without one.

3. Start the dev server:

   ```bash
   npm run dev
   ```

### Autocomplete Limitation

Username autocomplete uses the GitHub Search API and may stop working after a few unauthenticated
requests due to rate limiting. To increase the limit, authenticate with a GitHub personal access
token by following the existing `.env.example` setup steps in the Getting Started section.

## Scripts

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `npm run dev`      | Start Vite dev server             |
| `npm run build`    | Production build                  |
| `npm run preview`  | Preview production build          |
| `npm run lint`     | Run ESLint                        |
| `npm run format`   | Format code with Prettier         |
| `npm run prettier` | Check formatting with Prettier    |
| `npm run deploy`   | Build and publish to GitHub Pages |
