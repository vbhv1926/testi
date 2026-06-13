# XRaid Application

## Overview
XRaid is a Next.js application that provides a dashboard for managing X (Twitter) accounts. It uses Prisma with a SQLite database to store accounts.

## Features
- Add accounts using cookies, auth tokens, or manual login.
- View accounts in a clean dashboard.
- Automatically assign proxies to new accounts from a pre-defined list.
- Automatically fetch profile pictures from X using unavatar.io.
- Accounts status tracking (Active, Suspended, Offline).

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npx prisma generate` to generate the Prisma client.

### Database
The repository comes pre-loaded with an SQLite database (`dev.db`) containing 4 working accounts. When you clone the repository, these accounts will already be there and ready to use.

### Running the Application

**Local Development**
Run the following command to start the app locally:
``bash
npm run dev
``
Then open http://localhost:3000 in your browser.

**Network Access**
To access the app from other devices on your local network:
``bash
npm run dev -- -H 0.0.0.0
``
Then open `http://<YOUR_LOCAL_IP>:3000` on your other device.

## Scripts
- **check-accounts.js**: Checks the validity of accounts by verifying their cookies. Accounts found to be suspended or invalid are automatically removed from the database.