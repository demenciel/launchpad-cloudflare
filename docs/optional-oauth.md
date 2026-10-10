# Optional OAuth-protected APIs and MCP

The default starter uses Better Auth for application login. Google/GitHub are upstream identity providers; session cookies protect the app’s own Hono endpoints. No OAuth authorization server is needed for this setup.

For an MCP server or external clients that need OAuth access to your APIs, opt into Cloudflare’s [Workers OAuth Provider](https://github.com/cloudflare/workers-oauth-provider):

```sh
bun add --exact @cloudflare/workers-oauth-provider@1.2.1
```

This exact version is published under `@cloudflare/workers-oauth-provider`. It remains an optional module; the default package manifest, Worker handler, D1 schema, and login flow do not depend on it.

When you enable it, follow that version’s documentation to configure token storage/bindings, authorization and consent, registered clients, scopes, discovery metadata, token endpoints, and protected resource routes. Keep the existing Better Auth session layer for the browser application and use it to identify consenting users where appropriate. Do not substitute the OAuth server for the Google/GitHub login providers.

Add focused tests for consent, redirect URI validation, scopes, token expiry, revocation, and protected routes before deployment. Regenerate Worker types after adding bindings.
