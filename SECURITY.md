# Security Policy

## Supported Versions

This project follows [semantic versioning](https://semver.org/). Only the latest published release on npm
(`@nightsquawktech/appfolio-mcp-server`) receives security fixes.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report privately via one of:

- [GitHub Security Advisories](https://github.com/NightSquawk/appfolio-mcp-server/security/advisories/new) for this repository (preferred)
- Email: [hello@nightsquawk.tech](mailto:hello@nightsquawk.tech)

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (a minimal repro is very helpful)
- The affected version(s)

We will acknowledge reports within a reasonable timeframe and keep you updated as we investigate and fix
the issue. Once a fix is released, we will credit reporters (unless anonymity is requested) in the release
notes.

## Scope

This server is a thin MCP catalog/proxy layer over the AppFolio Reports and Database APIs. It does not
store AppFolio data at rest. See the "Security & write safety" section of the [README](README.md) for
guidance on credential scoping and the write-gate limitations of the current version.
