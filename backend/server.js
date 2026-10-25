const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 8001;

app.use(cors()); 
app.use(express.json()); 

const db = new sqlite3.Database('./books.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});


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




app.get('/', (req, res) => {
  res.send('BookLoop API is running smoothly!');
});


app.get('/api/books', (req, res) => {
  const query = 'SELECT * FROM books ORDER BY created_at DESC';

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ books: rows });
  });
});


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
