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
// of them with query params, e.g. /card.json?name=Jane%20Doe&id=12345
function buildRecord(req) {
  const q = req.query || {};
  return {
    id: q.id || '100245',
    firstName: q.firstName || 'Alice',
    lastName: q.lastName || 'Johnson',
    name: q.name || 'Alice Johnson',
    title: q.title || 'Software Engineer',
    department: q.department || 'Engineering',
    company: q.company || 'Example Corp',
    email: q.email || 'alice@example.com',
    issueDate: q.issueDate || '2026-05-30',
    expiryDate: q.expiryDate || '2030-05-30',
    // A photo can be supplied as a reachable URL...
    photoUrl: q.photoUrl || `http://${req.headers.host}/photo.png`,
    // ...or as inline base64 (1x1 transparent PNG placeholder here).
    photoBase64:
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
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
    hint: 'Point the printer\'s web source at one of these. Override fields with query params, e.g. ?id=12345&name=Jane%20Doe',
    endpoints: {
      '/card.json': 'Single record as a JSON object',
      '/card.array.json': 'Single record wrapped in a JSON array',
      '/card.nested.json': 'Record nested under a "record"/"data" key',
      '/card.xml': 'Record as XML (elements)',
      '/card.xml.attrs': 'Record as XML (attributes)',
      '/card.csv': 'Record as CSV with header row',
      '/card.txt': 'Record as pipe-delimited plain text',
      '/photo.png': 'Sample 1x1 PNG (used by photoUrl)',
      '/echo': 'Echoes the request (method, headers, query, body) for debugging'
    }
  });
});

// --- JSON variants ----------------------------------------------------------
app.all('/card.json', (req, res) => {
  res.json(buildRecord(req));
});

app.all('/card.array.json', (req, res) => {
  res.json([buildRecord(req)]);
});

app.all('/card.nested.json', (req, res) => {
  const record = buildRecord(req);
  res.json({ status: 'ok', count: 1, record, data: [record] });
});

// --- XML variants -----------------------------------------------------------
app.all('/card.xml', (req, res) => {
  const r = buildRecord(req);
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<record>\n' +
    Object.entries(r)
      .map(([k, v]) => `  <${k}>${xmlEscape(v)}</${k}>`)
      .join('\n') +
    '\n</record>\n';
  res.type('application/xml').send(body);
});

app.all('/card.xml.attrs', (req, res) => {
  const r = buildRecord(req);
  const attrs = Object.entries(r)
    .map(([k, v]) => `${k}="${xmlEscape(v)}"`)
    .join(' ');
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<record ${attrs} />\n`);
});

// --- CSV --------------------------------------------------------------------
app.all('/card.csv', (req, res) => {
  const r = buildRecord(req);
  const keys = Object.keys(r);
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const body =
    keys.join(',') + '\n' + keys.map((k) => escape(r[k])).join(',') + '\n';
  res.type('text/csv').send(body);
});

// --- Plain text (pipe-delimited) -------------------------------------------
app.all('/card.txt', (req, res) => {
  const r = buildRecord(req);
  res.type('text/plain').send(Object.values(r).join('|') + '\n');
});

// --- Sample photo -----------------------------------------------------------
app.get('/photo.png', (req, res) => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  res.type('image/png').send(png);
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
