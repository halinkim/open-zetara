# Zetara

[![npm version](https://img.shields.io/npm/v/zetara.svg)](https://www.npmjs.com/package/zetara)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful paper reading and annotation tool with canvas-based note-taking, inspired by Jupyter Lab.

## Features

- 📄 **PDF Viewer**: Built-in PDF viewer with smooth navigation
- 🎨 **Canvas Editor**: Draw, annotate, and create visual notes alongside your papers
- 🗂️ **Paper Management**: Organize and manage your research papers
- 👥 **Paper Groups**: Create groups to visualize relationships between papers
- 📊 **Statistics**: Track your reading activity
- 🔒 **Password Protection**: Secure your research with password authentication
- 🌐 **Self-Hosted**: Run on your own server, just like Jupyter Lab
- ⚙️ **CLI Configuration**: Easy setup and configuration via command line

## Installation

Install Zetara globally using npm:

```bash
npm install -g zetara
```

Or use npx to run without installing:

```bash
npx zetara
```

## Quick Start

### 1. First Time Setup

Set a password (optional but recommended):

```bash
zetara password
```

### 2. Start the Server

```bash
# Build and start (first time)
npm run build
zetara

# Development mode (no build required)
npm run dev
```

The application will start at `http://localhost:3000` by default.

### 3. Access the Application

Open your browser and navigate to `http://localhost:3000`. If you set a password, you'll be prompted to log in.

## CLI Usage

### Basic Commands

```bash
# Start server (default: port 3000)
zetara

# Set/update password
zetara password

# View current configuration
zetara config
```

### Server Options

```bash
# Custom port
zetara --port=8080
zetara -p 8080

# Bind to specific IP
zetara --ip="127.0.0.1"  # localhost only
zetara --ip="*"          # all interfaces (default: 0.0.0.0)

# IP whitelist (CIDR notation supported)
zetara --allowed-ips="192.168.1.0/24,10.0.0.5"

# Custom data directory
zetara --data-dir="/path/to/your/data"

# Disable password temporarily
zetara --no-password

# Session timeout (seconds)
zetara --session-max-age=3600  # 1 hour
```

### Example Scenarios

**Local development:**
```bash
npm run dev
```

**Secure local server:**
```bash
zetara password
npm run build
zetara
```

**Lab network server (IP restricted):**
```bash
zetara --port=8080 --allowed-ips="192.168.1.0/24"
```

## Configuration

Settings are stored in `~/.zetara/config.json`:

**Location:**
- Linux/macOS: `~/.zetara/config.json`
- Windows: `C:\Users\[username]\.zetara\config.json`

**Example configuration:**
```json
{
  "port": 3000,
  "host": "0.0.0.0",
  "dataDir": "/path/to/data",
  "allowedIps": [],
  "passwordHash": "$2b$10$...",
  "sessionSecret": "auto-generated-hex-string",
  "sessionMaxAge": 86400
}
```

> ⚠️ **Note**: Don't edit `config.json` manually. Use the CLI commands instead.

## Data Storage

By default, Zetara stores your papers and data in:
- Linux/macOS: `~/.zetara/data/`
- Windows: `C:\Users\[username]\.zetara\data\`

You can customize this with the `--data-dir` option or by setting `dataDir` in the config.

## Security Recommendations

1. **Set a strong password**: Use at least 8 characters
2. **Use IP restrictions**: Limit access to trusted networks when possible
3. **HTTPS**: Use a reverse proxy (nginx, Caddy) with SSL in production
4. **Keep updated**: Regularly update to the latest version

## Troubleshooting

### Forgot password?

Reset your password:
```bash
zetara password
```

Or delete the config file to reset everything:
```bash
# Windows
del %USERPROFILE%\.zetara\config.json

# Linux/macOS
rm ~/.zetara/config.json
```

### Port already in use?

Change the port:
```bash
zetara --port=8080
```

### Cannot access from other computers?

Make sure you're binding to all interfaces:
```bash
zetara --ip="*"
```

And check your firewall settings.

## Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/zetara.git
cd zetara

# Install dependencies
npm install

# Run development server
npm run dev
```

### Building

```bash
npm run build
```

## Documentation

- [Deployment Guide](./README_DEPLOYMENT.md) - Detailed deployment instructions
- [Contributing](./CONTRIBUTING.md) - How to contribute (coming soon)

## Tech Stack

- **Frontend**: Next.js 16, React 19
- **PDF Rendering**: PDF.js
- **Canvas**: Custom canvas implementation with tldraw-inspired architecture
- **Authentication**: bcrypt, cookie-based sessions
- **Storage**: File-based (JSON)

## License

MIT © [Your Name]

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history (coming soon).

## Support

- 🐛 [Report bugs](https://github.com/yourusername/zetara/issues)
- 💡 [Request features](https://github.com/yourusername/zetara/issues)
- 📖 [Documentation](https://github.com/yourusername/zetara#readme)

---

**Inspired by Jupyter Lab's philosophy**: Simple installation, powerful features, self-hosted control.
