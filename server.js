// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./employees.db');

// Create a table if not exists
db.run(`CREATE TABLE IF NOT EXISTS employees (id INT, name TEXT, designation TEXT)`);

app.post('/getEmployeeDetails', (req, res) => {
  const { employeeId } = req.body;

  db.get(`SELECT * FROM employees WHERE id = ?`, [employeeId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      
      return;

    }

    if (!row) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.json({ name: row.name, designation: row.designation });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});