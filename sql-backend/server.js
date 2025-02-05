const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456789',
  database: 'testdb'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// ✅ **Get Schema Correctly**
app.get('/get-schema', (req, res) => {
  const schemaQuery = `
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'testdb';
  `;

  db.query(schemaQuery, (err, results) => {
    if (err) {
      console.error('Error fetching schema:', err);
      return res.status(500).json({ error: 'Failed to fetch schema' });
    }

    // Organizing schema properly
    const schema = {};
    results.forEach(row => {
      if (!schema[row.TABLE_NAME]) {
        schema[row.TABLE_NAME] = [];
      }
      schema[row.TABLE_NAME].push({ column: row.COLUMN_NAME, type: row.DATA_TYPE });
    });

    res.json({ schema });
  });
});

// ✅ **Execute SQL Queries & Update Schema**
app.post('/execute-query', (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: err.sqlMessage || 'Failed to execute query' });
    }

    // If modifying data (INSERT, UPDATE, DELETE, etc.), fetch updated schema
    if (/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s+/i.test(query)) {
      db.query(`
        SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'testdb';
      `, (schemaErr, schemaResults) => {
        if (schemaErr) {
          console.error('Error fetching updated schema:', schemaErr);
          return res.status(500).json({ error: 'Query executed, but failed to update schema' });
        }

        const schema = {};
        schemaResults.forEach(row => {
          if (!schema[row.TABLE_NAME]) {
            schema[row.TABLE_NAME] = [];
          }
          schema[row.TABLE_NAME].push({ column: row.COLUMN_NAME, type: row.DATA_TYPE });
        });

        res.json({
          message: 'Query executed successfully',
          affectedRows: results.affectedRows,
          insertId: results.insertId,
          latestData: results.affectedRows ? null : results, // SELECT queries return data
          updatedSchema: schema, // Updated schema after modification
        });
      });
    } else {
      res.json({ results });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
