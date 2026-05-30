const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Accept any incoming body the printer software might send (it can POST a
// lookup key such as a badge ID), in JSON, urlencoded or plain-text form.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: '*/*' }));

// --- Sample card record -----------------------------------------------------
// These are the fields a Sigma DS3 card design typically maps to. Override any
// of them with query params, e.g. /card.json?name=Jane%20Doe&id=2

// 1x1 transparent PNG placeholder, shared by every record's photoBase64.
const PHOTO_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Two known users. Lookups by id return the matching one; id=1 is the default.
const USERS = {
  1: {
    id: '1',
    firstName: 'Alice',
    lastName: 'Johnson',
    name: 'Alice Johnson',
    title: 'Software Engineer',
    department: 'Engineering',
    company: 'Example Corp',
    email: 'alice@example.com',
    issueDate: '2026-05-30',
    expiryDate: '2030-05-30'
  },
  2: {
    id: '2',
    firstName: 'Bob',
    lastName: 'Smith',
    name: 'Bob Smith',
    title: 'Product Manager',
    department: 'Product',
    company: 'Example Corp',
    email: 'bob@example.com',
    issueDate: '2026-05-30',
    expiryDate: '2030-05-30'
  }
};

function buildRecord(req) {
  const q = req.query || {};
  const p = req.params || {};
  // A path param (/card.json/:id) wins over ?id=, which wins over the default.
  const id = p.id || q.id || '1';
  const base = USERS[id] || USERS[1];
  // Start from the known user, then let query params override any field.
  return {
    ...base,
    id,
    firstName: q.firstName || base.firstName,
    lastName: q.lastName || base.lastName,
    name: q.name || base.name,
    title: q.title || base.title,
    department: q.department || base.department,
    company: q.company || base.company,
    email: q.email || base.email,
    issueDate: q.issueDate || base.issueDate,
    expiryDate: q.expiryDate || base.expiryDate,
    // A photo can be supplied as a reachable URL...
    photoUrl: q.photoUrl || `http://${req.headers.host}/photo.png`,
    // ...or as inline base64 (1x1 transparent PNG placeholder here).
    photoBase64: PHOTO_BASE64
  };
}

function xmlEscape(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c])
  );
}

// --- Index: lists every test endpoint --------------------------------------
app.get('/', (req, res) => {
  res.json({
    message: 'Entrust Sigma DS3 web data-source test server',
    hint: 'Point the printer\'s web source at one of these. Two users exist: id=1 (Alice Johnson) and id=2 (Bob Smith). Pass the id in the path (/card.json/2) or as a query param (/card.json?id=2). Override any field with query params too, e.g. ?name=Jane%20Doe',
    endpoints: {
      '/user/:id': 'Lookup by path param, returns a JSON object (e.g. /user/1 or /user/2)',
      '/card.json': 'Single record as a JSON object (also /card.json/:id)',
      '/card.array.json': 'Single record wrapped in a JSON array',
      '/card.nested.json': 'Record nested under a "record"/"data" key',
      '/card.xml': 'Record as XML (elements)',
      '/card.xml.attrs': 'Record as XML (attributes)',
      '/card.csv': 'Record as CSV with header row',
      '/card.txt': 'Record as pipe-delimited plain text',
      '/id/:id': 'Returns just the id passed, e.g. {"id":"2"}',
      '/photo.png': 'Sample 1x1 PNG (used by photoUrl)',
      '/echo': 'Echoes the request (method, headers, query, body) for debugging'
    }
  });
});

// --- JSON variants ----------------------------------------------------------
// Each route accepts both a query-param form (/card.json?id=123) and a
// path-param form (/card.json/123), so you can test whichever URL template the
// Sigma client uses. /user/:id is a plain alias for the JSON object form.
app.all(['/card.json', '/card.json/:id', '/user/:id'], (req, res) => {
  res.json(buildRecord(req));
});

app.all(['/card.array.json', '/card.array.json/:id'], (req, res) => {
  res.json([buildRecord(req)]);
});

app.all(['/card.nested.json', '/card.nested.json/:id'], (req, res) => {
  const record = buildRecord(req);
  res.json({ status: 'ok', count: 1, record, data: [record] });
});

// --- XML variants -----------------------------------------------------------
app.all(['/card.xml', '/card.xml/:id'], (req, res) => {
  const r = buildRecord(req);
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<record>\n' +
    Object.entries(r)
      .map(([k, v]) => `  <${k}>${xmlEscape(v)}</${k}>`)
      .join('\n') +
    '\n</record>\n';
  res.type('application/xml').send(body);
});

app.all(['/card.xml.attrs', '/card.xml.attrs/:id'], (req, res) => {
  const r = buildRecord(req);
  const attrs = Object.entries(r)
    .map(([k, v]) => `${k}="${xmlEscape(v)}"`)
    .join(' ');
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<record ${attrs} />\n`);
});

// --- CSV --------------------------------------------------------------------
app.all(['/card.csv', '/card.csv/:id'], (req, res) => {
  const r = buildRecord(req);
  const keys = Object.keys(r);
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const body =
    keys.join(',') + '\n' + keys.map((k) => escape(r[k])).join(',') + '\n';
  res.type('text/csv').send(body);
});

// --- Plain text (pipe-delimited) -------------------------------------------
app.all(['/card.txt', '/card.txt/:id'], (req, res) => {
  const r = buildRecord(req);
  res.type('text/plain').send(Object.values(r).join('|') + '\n');
});

// --- Sample photo -----------------------------------------------------------
app.get('/photo.png', (req, res) => {
  const png = Buffer.from(PHOTO_BASE64, 'base64');
  res.type('image/png').send(png);
});

// --- Id: just returns the id passed (path param or ?id=) --------------------
app.all(['/id', '/id/:id'], (req, res) => {
  res.json({ id: req.params.id || req.query.id || null });
});

// --- Echo: see exactly what the printer sends -------------------------------
app.all('/echo', (req, res) => {
  res.json({
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}/ to see all test endpoints`);
});
