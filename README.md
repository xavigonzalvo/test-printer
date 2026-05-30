# Entrust Sigma DS3 — Web Data-Source Test Server

A minimal Node.js + Express server for testing the **web data source** of the
Entrust Sigma DS3 (ID3) card printer's local program. When you configure a web
source, the printer software calls an HTTP endpoint and maps the response onto
card fields (name, ID, photo, etc.). The exact format it accepts depends on
configuration, so this server returns the **same sample record in several
formats** so you can try them all and see which one the printer reads.

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

```bash
PORT=8080 npm start   # custom port
```

Then open `http://localhost:3000/` to see the list of all endpoints.

> **Note:** For the printer to reach the server (and to fetch `photoUrl`), use a
> hostname/IP the printer can route to — e.g. `http://192.168.1.x:3000/...`,
> not `localhost`.

## Endpoints

Each card endpoint returns the same record in a different format:

| Endpoint | Format |
| --- | --- |
| `/` | Index — lists every endpoint as JSON |
| `/user/:id` | Lookup by path param, returns a JSON object |
| `/card.json` | Single record as a JSON object |
| `/card.array.json` | Record wrapped in a JSON array |
| `/card.nested.json` | Record nested under `record`/`data` keys |
| `/card.xml` | Record as XML (elements) |
| `/card.xml.attrs` | Record as XML (attributes) |
| `/card.csv` | Record as CSV with a header row |
| `/card.txt` | Record as pipe-delimited plain text |
| `/photo.png` | Sample 1×1 PNG (what `photoUrl` points at) |
| `/echo` | Echoes the request (method, headers, query, body) for debugging |

All `/card.*` endpoints accept both `GET` and `POST`, and accept JSON,
urlencoded, or plain-text request bodies — so the printer's request won't be
rejected regardless of how it's sent.

## Users

There are two sample users. Look them up by id:

| id | Name | Title | Department | Email |
| --- | --- | --- | --- | --- |
| `1` | Alice Johnson | Software Engineer | Engineering | alice@example.com |
| `2` | Bob Smith | Product Manager | Product | bob@example.com |

An unknown id returns the user 1 record with the requested id echoed back. `id=1`
is the default when no id is given.

## Passing an ID

Every card endpoint accepts the ID two ways. Precedence is
**path param → `?id=` query → default (1)**.

- **Path param** (URL-template style — use this for the Sigma `{Id}` token):
  ```
  http://localhost:3000/user/2
  http://localhost:3000/card.json/2
  http://localhost:3000/card.xml/2
  ```
  In the printer's web-source config, enter the URL as
  `http://<host>:3000/user/{Id}`.

- **Query param:**
  ```
  http://localhost:3000/card.json?id=2
  ```

Any field can also be overridden with query params:

```
http://localhost:3000/user/2?name=Jane%20Doe&title=Manager&department=Sales
```

Overridable fields: `id`, `firstName`, `lastName`, `name`, `title`,
`department`, `company`, `email`, `issueDate`, `expiryDate`, `photoUrl`.
Each record also includes `photoBase64` (inline image data) in case the printer
expects an embedded photo instead of a URL.

## curl Examples

```bash
# JSON object for each user
curl -s http://localhost:3000/user/1
curl -s http://localhost:3000/user/2

# JSON object, fields overridden
curl -s "http://localhost:3000/card.json?id=2&name=Jane%20Doe"

# XML and CSV variants
curl -s http://localhost:3000/card.xml/2
curl -s http://localhost:3000/card.csv/2

# See exactly what the printer sends (point the printer's web source here)
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"badgeId":"42"}' http://localhost:3000/echo
```

### Finding the printer's request shape

If you're not sure whether the Sigma client uses `GET` or `POST`, or what
lookup key it passes, point its web source at `/echo` once. The response shows
the method, headers, query string, and body it sent — use that to pick the
matching card endpoint (and we can add a real per-ID lookup table if needed).

## Deploying to Render

Use these settings in Render:

- Build Command: `npm install`
- Start Command: `npm start`

Render sets the `PORT` automatically.
