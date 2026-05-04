# Installation

## Production Global Install

Install the public GitHub repository as a global CLI:

```bash
npm install --global github:linuxlewis/vanta-cli
```

Verify that the binary is on `PATH`:

```bash
vanta-cli --help
```

This is the recommended setup when other local agents should be able to call the CLI by name.

## Agent Environment

The CLI reads `VANTA_API_TOKEN` from the process environment:

```bash
export VANTA_API_TOKEN=vat_YOUR_TOKEN
```

Put that export in the shell profile, direnv file, or agent bootstrap script that launches the agents. Any process that can see `VANTA_API_TOKEN` can run:

```bash
vanta-cli tests list
```

## Local Development Install

From a local checkout:

```bash
pnpm install
pnpm build
npm install --global .
```

After source changes, rerun:

```bash
pnpm build
```

The global binary points to the package's built `dist/cli.js` entrypoint.

## Uninstall

```bash
npm uninstall --global vanta-cli
```
