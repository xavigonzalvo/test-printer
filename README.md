# Simple Users API

A minimal Node.js + Express API server that returns a list of 3 users in JSON.

## Requirements

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Run Locally

```bash
npm start
```

The server runs on `PORT` from the environment, or `3000` by default.

## Endpoints

- `GET /` - health/info message
- `GET /users` - returns 3 users as JSON

## curl Examples

Local:

```bash
curl -s http://localhost:3000/users
```

If your local port is different (example `4001`):

```bash
curl -s http://localhost:4001/users
```

Deployed on Render (replace with your actual URL):

```bash
curl -s https://your-service-name.onrender.com/users
```

## Deploying to Render

Use these settings in Render:

- Build Command: `npm install`
- Start Command: `npm start`

Render sets the `PORT` automatically.
