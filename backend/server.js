const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 8001;

// 1. Middleware
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Allow backend to read JSON sent in requests

// 2. Connect to SQLite Database (Creates 'books.db' file automatically)
const db = new sqlite3.Database('./books.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// 3. Create the Books Table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    original_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    condition TEXT NOT NULL,
    description TEXT,
    seller_name TEXT NOT NULL,
    seller_phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ================= ROUTES (APIs) ================= //

// Route 1: Health check (just to test in your browser)
app.get('/', (req, res) => {
  res.send('BookLoop API is running smoothly!');
});

// Route 2: GET all books (React will call this to show listings)
app.get('/api/books', (req, res) => {
  const query = 'SELECT * FROM books ORDER BY created_at DESC';

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ books: rows });
  });
});

// Route 3: POST a new book (React form will send data here)
app.post('/api/books', (req, res) => {
  const {
    title,
    author,
    original_price,
    selling_price,
    condition,
    description,
    seller_name,
    seller_phone,
  } = req.body;

  // Simple validation to ensure critical fields are present
  if (!title || !author || !selling_price || !seller_phone) {
    return res.status(400).json({
      error: 'Please provide title, author, selling price, and contact info.',
    });
  }

  const query = `
    INSERT INTO books (
      title, author, original_price, selling_price, condition, description, seller_name, seller_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    title,
    author,
    original_price || 0,
    selling_price,
    condition || 'Good',
    description || '',
    seller_name,
    seller_phone,
  ];

  db.run(query, values, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Return the newly created book ID
    res.status(201).json({
      message: 'Book listed successfully!',
      bookId: this.lastID,
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});