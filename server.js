const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Carol Davis', email: 'carol@example.com' }
];

app.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    usersEndpoint: '/users'
  });
});

app.get('/users', (req, res) => {
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
