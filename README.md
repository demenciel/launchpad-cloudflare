# Launchpad — AstroWind + Cloudflare SaaS Starter

A reusable, single-project starter based on [Cloudflare AI SaaS Stack](https://github.com/vijaynandwani/cloudflare-ai-saas-stack). [AstroWind](https://github.com/arthelokyo/astrowind) provides the Astro landing-page widgets and styles. React islands keep the interactive workspace, while Hono runs the API on Cloudflare Workers and Better Auth/Drizzle use Cloudflare D1. One project builds into one Worker plus static assets.

Included:

- An AstroWind landing page, responsive navigation, FAQs, local Inter font, and a shared light/dark theme.
- Google and GitHub sign-in with shared Better Auth sessions.
- A Resend welcome email on first account creation, reusable HTML/plain-text welcome and notification templates, and a shared email layout.
- The official OpenAI SDK behind an authenticated API, with bounded inputs, output limits, timeouts, and native Cloudflare rate limiting.
- The existing Workers AI post-writing example, sharing the same AI request allowance.
- Motion with reusable `Reveal`, `Stagger`, `StaggerItem`, and `AnimatedButton` components, a lightweight feature provider, and reduced-motion support.
- TanStack Router, Query, and Form; Tailwind CSS; shadcn/ui; TypeScript; Biome.

## Licensing and credits

This is a public GitHub fork. AstroWind is MIT licensed; our original additions are MIT licensed. The upstream Cloudflare AI SaaS Stack currently has no published license, so the entire combined starter cannot be represented as MIT licensed or fully open source. See [NOTICE.md](NOTICE.md) for source commits, attribution, and the scope of the additions license.

## Get started

Use Node.js 22.22.3+ and Bun:

```sh
git clone https://github.com/demenciel/launchpad-cloudflare.git
cd launchpad-cloudflare
bun install
cp .dev.vars.example .dev.vars
```

Generate a strong auth secret (`openssl rand -base64 32`) and fill in `.dev.vars`:

| Setting | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Random secret, at least 32 characters |
| `BETTER_AUTH_URL` | App origin, such as `http://localhost:5173` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth App credentials |
| `RESEND_API_KEY` | Resend API key; blank skips welcome emails |
| `EMAIL_FROM` | Sender on a verified Resend domain, e.g. `MyApp <hello@example.com>` |
| `OPENAI_API_KEY` | Server-side OpenAI key; blank makes the OpenAI endpoint return 503 |

`APP_NAME` and `OPENAI_MODEL` are ordinary configuration in `wrangler.json`; you can override them locally in `.dev.vars`. The example model is `gpt-4.1-mini`; choose a Responses-compatible model available to your OpenAI account. Never put provider keys in `VITE_*` variables or client code. Keep `.dev.vars` out of Git.

### Database

The checked-in D1 ID is a placeholder, so the starter never targets the original author’s database.

```sh
bunx wrangler d1 create cloudflare-ai-saas-stack
```

Replace `database_id` in `wrangler.json` with the returned ID. Existing auth and post migrations are already included:

```sh
bun run db:migrate
bun run cf-typegen
bun run dev
```

Open `http://localhost:5173`. The development command supervises Astro on port 5173 and Wrangler on port 8787, with `/api` proxied to Wrangler under the same browser origin. Use port 5173 for the frontend and OAuth callbacks. Configure OAuth before using login; sign in, then open **AI assistant** to try OpenAI or **Create Post** to use the existing Workers AI example. The Workers AI binding uses Cloudflare’s remote service and needs Cloudflare credentials; it can consume Workers AI usage.

### Google OAuth

Create a Google OAuth web application. Add your app origin and these authorized redirect URLs (replace the production domain):

```text
http://localhost:5173/api/auth/callback/google
https://your-domain.com/api/auth/callback/google
```

### GitHub OAuth

Create a [GitHub OAuth App](https://github.com/settings/developers), set its homepage to your app origin, and use:

```text
http://localhost:5173/api/auth/callback/github
```

Create a separate OAuth App for production with `https://your-domain.com/api/auth/callback/github`. GitHub OAuth Apps use a single callback URL. Both providers use the same login screen; first login creates the account. `assets.run_worker_first` routes `/api/*` directly to the Worker so OAuth callbacks reach Hono before static asset handling. Email/password authentication remains disabled in this starter.

## Frontend and customization

The public `/` page is static Astro, composed from AstroWind’s `HeroText`, `Features2`, `FAQs`, and `CallToAction` widgets. `/login`, `/register`, `/dashboard`, `/ai`, `/create-post`, and `/profile` mount the existing TanStack React application through `client:only="react"`. API paths and OAuth callbacks remain under `/api/*`. The dashboard is now `/dashboard`; `/` is the public landing page.

Customize landing-page content in `src/pages/index.astro`, brand colors and shared styles in `src/assets/styles/theme.css`, and the logo in `src/components/common/Brand.astro`. Update `APP_NAME` and email templates when changing the product name. AstroWind source attribution and its MIT license are retained in `vendor/astrowind`.

Add new React workspace routes in `src/client/routes` and add their path to `getStaticPaths` in `src/pages/[...workspace].astro`, so direct visits have a static shell in production. These shells contain no user data. Client route guards redirect visitors to login; the Worker separately enforces authentication for protected APIs. Unknown paths use the branded 404 page.

After `bun run build`, use `bun run preview` to preview the production Worker and static assets on Wrangler’s local port. `bun run dev` is the editing workflow with Astro hot reload.

## Email

`src/worker/email/templates.ts` contains `emailLayout`, `welcomeEmail`, and `notificationEmail`. Each returns `{ subject, html, text }`. User-provided strings are HTML-escaped and action links accept only HTTP/HTTPS.

`src/worker/email/index.ts` provides `sendEmail` for trusted server code. For example:

```ts
import { sendEmail } from "@worker/email";
import { notificationEmail } from "@worker/email/templates";

await sendEmail(env, user.email, notificationEmail({
  appName: env.APP_NAME,
  heading: "Your export is ready",
  message: "You can now download your export from your workspace.",
  action: { label: "Open workspace", url: env.BETTER_AUTH_URL },
}), `export-ready/${exportId}`);
```

Choose a stable idempotency key for each event. Resend retains idempotency keys for 24 hours. The signup hook uses `welcome/<user-id>` and is attached to user creation, not session creation, so routine logins do not send another welcome email.

Welcome delivery runs with the Worker’s `waitUntil`, has a 10-second timeout, and logs a generic failure without blocking authentication. Delivery is best effort: this starter has no durable queue or automatic retry. If guaranteed delivery is needed, add a Cloudflare Queue or D1 outbox. Missing email configuration explicitly skips delivery. Resend requires a verified sending domain for arbitrary recipients; its test sender is limited to your account’s email.

## AI API

`POST /api/ai/openai` requires a signed-in session and JSON:

```json
{ "prompt": "Suggest three names for a habit tracker" }
```

Success:

```json
{ "success": true, "data": { "content": "..." } }
```

The route trims and validates a 1–4000-character prompt, caps the actual request body at 16 KiB, uses a server-selected model with 512 output tokens, disables response storage, sets a 30-second timeout, and disables SDK retries. Credentials and provider error details stay on the server. Upstream failures return a generic 502; missing OpenAI configuration returns 503.

Both `/api/ai/openai` and `/api/ai/generate-content` share `AI_RATE_LIMITER` with a key derived from the authenticated user ID. The default is **10 requests per 60 seconds per user per Cloudflare location**. Rejected calls return 429 with `Retry-After: 60`; a missing limiter fails closed with 503. Cross-origin browser calls are rejected. Authentication and validation happen before a provider request.

Edit `ratelimits` in `wrangler.json` to change the allowance. Pick an account-unique `namespace_id`; reusing it across Workers shares counters. This is a basic abuse control, not a globally exact billing quota: Cloudflare rate limits are approximate and local to each Cloudflare location. Use D1 or Durable Objects if you need strict global usage accounting.

## Animated UI

`MotionProvider` wraps the app once using `LazyMotion` and `MotionConfig reducedMotion="user"`. Components live in `src/client/components/animated`:

```tsx
import { Reveal, Stagger, StaggerItem, AnimatedButton } from "@client/components/animated";

<Reveal><h1>Welcome back</h1></Reveal>
<Stagger className="grid gap-4">
  {items.map((item) => <StaggerItem key={item.id}>{item.name}</StaggerItem>)}
</Stagger>
<AnimatedButton onClick={save}>Save changes</AnimatedButton>
```

`AnimatedButton` supports the existing button variants, native button behavior, and disabled states. Entrance effects and hover/tap transforms are disabled when reduced motion is requested. The login screen, dashboard, and AI assistant demonstrate the components. AstroWind’s public-page entrances use its lightweight intersection observer; both animation paths respect reduced motion.

## Optional OAuth server module

`workers-oauth-provider` is optional and is not installed or wired into the default app. Better Auth handles Google/GitHub login and session-protected application APIs.

Only add an OAuth authorization server if you are building an MCP server or exposing APIs to external OAuth clients. The official package name is scoped, and the requested published version can be installed exactly:

```sh
bun add --exact @cloudflare/workers-oauth-provider@1.2.1
```

Version 1.2.1 is a deliberate optional pin, not a claim about the latest release. See [the optional module guide](docs/optional-oauth.md) before adding it.

## Validation and deployment

```sh
bun run test       # Mocked auth/email/AI behavior and security boundaries
bun run typecheck  # Astro, React, Worker, and shared types
bun run check      # Typecheck, tests, production build, and deployment dry run
```

The tests do not send real email or spend OpenAI credits. Live OAuth callbacks and actual provider delivery need your credentials and should be smoke-tested after configuration. The React workspace is loaded only on workspace routes.

Set `BETTER_AUTH_URL` to your production HTTPS origin. Store production secrets with Wrangler, not in checked-in configuration:

```sh
bunx wrangler secret put BETTER_AUTH_SECRET
bunx wrangler secret put BETTER_AUTH_URL
bunx wrangler secret put GOOGLE_CLIENT_ID
bunx wrangler secret put GOOGLE_CLIENT_SECRET
bunx wrangler secret put GITHUB_CLIENT_ID
bunx wrangler secret put GITHUB_CLIENT_SECRET
bunx wrangler secret put RESEND_API_KEY
bunx wrangler secret put EMAIL_FROM
bunx wrangler secret put OPENAI_API_KEY
bun run db:migrate:remote
bun run deploy
```

Astro builds static assets into `dist/site`; Wrangler bundles the existing Hono entrypoint and serves those assets alongside `/api/*`. No Astro SSR adapter or second production service is needed. Wrangler is pinned to a version supporting `ratelimits`. Re-run `bun run cf-typegen` after changing bindings. Hand-maintained secret types are in `src/worker/env.d.ts`; generated runtime and binding types are in `worker-configuration.d.ts`.

## Project structure

```text
src/pages/                       Astro landing page and workspace route shells
src/layouts/SiteLayout.astro      Shared document, metadata, fonts, and theme
src/components/                  Adapted AstroWind widgets and UI
src/assets/styles/theme.css      Brand and shared light/dark theme
src/client/components/animated/   Reusable Motion components
src/client/routes/               React workspace routes, including /dashboard and /ai
src/worker/auth.ts               Google/GitHub auth and signup hook
src/worker/email/                Resend service and reusable templates
src/worker/routes/ai.ts          OpenAI and Workers AI endpoints
src/worker/middleware/           Sessions, authentication, AI limits
src/worker/db/                   D1/Drizzle schema and migrations
src/shared/schema/              Shared request validation
tests/                          Mocked behavior tests
vendor/astrowind/                Upstream source attribution and MIT license
```

Additional database commands: `bun run db:generate`, `bun run db:studio`, `bun run db:migrate`, and `bun run db:migrate:remote`.
