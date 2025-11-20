const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Route بسيطة للصحة
app.get('/', (_req, res) => res.send('Google Books proxy is running'));

// Proxy route
app.get('/books', async (req, res) => {
  const query = req.query.q;
  const maxResults = req.query.maxResults || 20;
  if (!query) return res.status(400).json({ error: 'Missing query parameter "q"' });

  try {
    const url = `https://www.googleapis.com/books/v1/volumes`;
    const { data } = await axios.get(url, {
      params: {
        q: query,
        maxResults,
        key: process.env.GOOGLE_BOOKS_KEY, // مخفي دائماً
      },
    });
    res.json(data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
