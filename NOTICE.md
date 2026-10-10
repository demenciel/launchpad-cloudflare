# Sources and licensing

Launchpad combines the Cloudflare AI SaaS Stack application with adapted AstroWind frontend components and new integrations.

## Cloudflare AI SaaS Stack

- Source: https://github.com/vijaynandwani/cloudflare-ai-saas-stack
- Author: Vijay Nandwani
- Base commit: `d059382943410ac31e4e06bb3237cc662ff73f58`

This repository is a public GitHub fork and retains the upstream Git history. At publication on October 10, 2026, the upstream repository had no license file or license declaration. Its original code is not assigned a new license here. The MIT license for additions below does not grant rights to that inherited code. Upstream permission or an upstream open-source license is needed before the combined starter can be offered under one open-source license.

See [GitHub's licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) for the distinction between public repositories and licensed open-source software.

## AstroWind

- Source: https://github.com/arthelokyo/astrowind
- Integrated commit: `14e1a691f80548dcc36370847b1a02c0d0b12821`
- Copyright: 2023 onWidget
- License: MIT, preserved in [vendor/astrowind/LICENSE.md](vendor/astrowind/LICENSE.md)
- Adapted files and integration details: [vendor/astrowind/README.md](vendor/astrowind/README.md)

## Launchpad additions

New original code and documentation authored for this starter are licensed under the [MIT license for additions](docs/LICENSE-ADDITIONS.md). This applies only to those original additions, including the Resend email service and templates, OpenAI endpoint and limits, reusable Motion components, original Astro page composition and theme, and associated tests and integration scripts. It excludes inherited source from Cloudflare AI SaaS Stack and AstroWind, which retain their respective licensing status above.

Third-party package dependencies retain their own licenses.
