This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deployment Configuration

Zetara supports Jupyter Lab-style CLI configuration for deployment settings including port, IP restrictions, and password protection.

### Setting Up Password Protection

```bash
# Set password (stored as bcrypt hash in ~/.zetara/config.json)
node ./bin/zetara.js password

# View current configuration
node ./bin/zetara.js config
```

### Running with Custom Settings

```bash
# Change port
node ./bin/zetara.js --port=8080

# Bind to specific IP
node ./bin/zetara.js --ip="127.0.0.1"  # localhost only
node ./bin/zetara.js --ip="*"          # all interfaces

# IP whitelist (CIDR supported)
node ./bin/zetara.js --allowed-ips="192.168.1.0/24,10.0.0.5"

# Disable password temporarily
node ./bin/zetara.js --no-password

# Session timeout (seconds)
node ./bin/zetara.js --session-max-age=3600
```

### Configuration File

Settings are stored in `~/.zetara/config.json` (Windows: `C:\Users\[username]\.zetara\config.json`):

```json
{
  "port": 3000,
  "host": "0.0.0.0",
  "allowedIps": [],
  "passwordHash": "$2b$10$...",
  "sessionSecret": "auto-generated",
  "sessionMaxAge": 86400
}
```

For detailed deployment instructions, see [README_DEPLOYMENT.md](./README_DEPLOYMENT.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
