const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ success: true, message: 'RentEase API is running' });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));