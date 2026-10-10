# AstroWind source attribution

This starter integrates components and styles from [arthelokyo/astrowind](https://github.com/arthelokyo/astrowind), commit `14e1a691f80548dcc36370847b1a02c0d0b12821` (downloaded October 10, 2026).

Adapted source:

- `src/components/ui/{Button,Headline,WidgetWrapper}.astro`
- `src/components/widgets/{HeroText,Features2,FAQs,CallToAction}.astro`
- `src/components/common/Intersect.astro`
- `src/assets/styles/{tailwind,shadcn}.css`
- `src/types.d.ts` and the grid helper in `src/utils/utils.ts`

The imported files retain AstroWind’s component API. Changes include shared semantic colors, muted-text compatibility for the React workspace, and a project-specific page composition and theme. Inter is served from the local `@fontsource-variable/inter` package so builds do not need to contact a font provider.

The upstream blog, analytics, sample testimonials, sample pricing, and deployment adapters are not enabled. This integration uses Astro’s static output alongside the existing Hono Worker, rather than replacing the backend with an Astro server.

AstroWind’s MIT license is preserved in [LICENSE.md](LICENSE.md).
