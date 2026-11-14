const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

// Connect to SQLite Database
const db = new sqlite3.Database('./books.db', (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database (books.db).');
  }
});

// Create Tables
db.serialize(() => {
  // Books Table
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
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

    // Safely adds user_id if you already created books.db earlier
  db.run("ALTER TABLE books ADD COLUMN user_id INTEGER", (err) => {
    // If it already exists, SQLite will safely ignore it
  });


  // Orders Table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      total_amount REAL NOT NULL,
      items_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Root Health Check
app.get('/', (req, res) => {
  res.send('BooksLoop API is running smoothly!');
});

// ================= AUTHENTICATION ROUTES =================

// 1. SIGNUP: Register a new reader
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  console.log('📥 Received signup attempt for:', email);

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please fill in all fields (name, email, password).' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  // Password requirement: Minimum 8 characters, at least 1 number
  if (password.length < 8 || !/\d/.test(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and contain at least one number.',
    });
  }

  // Check if email already exists
  db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()], (err, existingUser) => {
    if (err) {
      console.error('SQL Error during email check:', err.message);
      return res.status(500).json({ error: 'Database check failed.' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered. Please sign in instead.' });
    }

    // Insert user into SQLite
    const insertQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.run(insertQuery, [name.trim(), email.toLowerCase().trim(), password], function (insertErr) {
      if (insertErr) {
        console.error('SQL Error inserting user:', insertErr.message);
        return res.status(500).json({ error: 'Could not create user account.' });
      }

      console.log(`🎉 New reader registered! ID: ${this.lastID}, Email: ${email}`);

      res.status(201).json({
        message: 'Library Card created successfully!',
        user: {
          id: this.lastID,
          name: name.trim(),
          email: email.toLowerCase().trim(),
        },
      });
    });
  });
});

// 2. LOGIN: Verify existing reader
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('🔑 Login attempt for:', email);

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password.' });
  }

  const query = 'SELECT id, name, email, password FROM users WHERE email = ?';
  db.get(query, [email.toLowerCase().trim()], (err, user) => {
    if (err) {
      console.error('SQL Error during login:', err.message);
      return res.status(500).json({ error: 'Database error occurred.' });
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }

    console.log(`✨ Successful login for: ${user.email}`);

    res.json({
      message: 'Welcome back!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });
});

// ================= BOOK ROUTES =================

app.get('/api/books', (req, res) => {
  db.all('SELECT * FROM books ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ books: rows });
  });
});

// 1. ADD NEW BOOK (9 columns, 9 question marks, 9 values)
app.post('/api/books', (req, res) => {
  const {
    user_id,
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
    return res.status(400).json({ error: 'Title, author, price, and phone are required.' });
  }

  // EXACTLY 9 COLUMNS:
  const query = `
    INSERT INTO books (
      user_id,
      title,
      author,
      original_price,
      selling_price,
      condition,
      description,
      seller_name,
      seller_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `; // <-- COUNT THEM: exactly 9 question marks!

  // EXACTLY 9 VALUES:
  const values = [
    user_id || null,             // 1
    title,                       // 2
    author,                      // 3
    original_price || 0,         // 4
    selling_price,               // 5
    condition || 'Good',         // 6
    description || '',           // 7
    seller_name || 'Anonymous',  // 8
    seller_phone,                // 9
  ];

  db.run(query, values, function (err) {
    if (err) {
      console.error('SQL Error inserting book:', err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ Book listed successfully! ID: ${this.lastID}`);
    res.status(201).json({
      message: 'Book listed successfully!',
      bookId: this.lastID,
    });
  });
});

// 2. EDIT / UPDATE BOOK (8 columns to update + 1 id in WHERE clause = 9 values)
app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
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
    return res.status(400).json({ error: 'Title, author, price, and phone are required.' });
  }

  const query = `
    UPDATE books
    SET 
      title = ?,
      author = ?,
      original_price = ?,
      selling_price = ?,
      condition = ?,
      description = ?,
      seller_name = ?,
      seller_phone = ?
    WHERE id = ?
  `; // <-- 8 columns to set + 1 id = 9 question marks total!

  const values = [
    title,                       // 1
    author,                      // 2
    original_price || 0,         // 3
    selling_price,               // 4
    condition || 'Good',         // 5
    description || '',           // 6
    seller_name || 'Anonymous',  // 7
    seller_phone,                // 8
    id,                          // 9 (for WHERE id = ?)
  ];

  db.run(query, values, function (err) {
    if (err) {
      console.error('SQL Error updating book:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log(`✏️ Book ID ${id} updated successfully!`);
    res.json({ message: 'Book updated successfully!' });
  });
});

// PLACE AN ORDER
app.post('/api/orders', (req, res) => {
  const { user_id, customer_name, customer_email, shipping_address, total_amount, items } = req.body;

  if (!customer_name || !customer_email || !shipping_address || !items || items.length === 0) {
    return res.status(400).json({ error: 'Please provide all shipping and order details.' });
  }

  const query = `
    INSERT INTO orders (user_id, customer_name, customer_email, shipping_address, total_amount, items_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [user_id || null, customer_name, customer_email, shipping_address, total_amount, JSON.stringify(items)],
    function (err) {
      if (err) {
        console.error('SQL Error saving order:', err.message);
        return res.status(500).json({ error: 'Could not record order.' });
      }
      console.log(`📦 Order #${this.lastID} placed by ${customer_name} for $${total_amount}!`);
      res.status(201).json({ message: 'Order sealed successfully!', orderId: this.lastID });
    }
  );
});


// UPDATE A BOOK LISTING
app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
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
    return res.status(400).json({ error: 'Title, author, price, and phone are required.' });
  }

  const query = `
    UPDATE books
    SET title = ?, author = ?, original_price = ?, selling_price = ?, condition = ?, description = ?, seller_name = ?, seller_phone = ?
    WHERE id = ?
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
    id,
  ];

  db.run(query, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Book not found' });
    console.log(`✏️ Updated book listing ID: ${id}`);
    res.json({ message: 'Book updated successfully!' });
  });
});




app.delete('/api/books/:id', (req, res) => {
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Book deleted successfully!' });
  });
});

// DELETE A BOOK LISTING PERMANENTLY FROM SQLITE
app.delete('/api/books/:id', (req, res) => {
  const id = Number(req.params.id);
  console.log(`📡 [DELETE REQUEST] Received for Book ID: ${id}`);

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid book ID' });
  }

  const query = 'DELETE FROM books WHERE id = ?';
  db.run(query, [id], function (err) {
    if (err) {
      console.error('❌ SQL Error deleting book:', err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ SQLite confirmed: Book ID ${id} deleted! Rows affected: ${this.changes}`);

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book already deleted or does not exist.' });
    }

    res.json({ message: 'Book deleted successfully from database!' });
  });
});



app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});