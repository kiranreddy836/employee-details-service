const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const mysql = require('mysql');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Create a MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Dolphin@9622',
  database: 'employeedirectory',
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Create a table if not exists
db.query(`
  CREATE TABLE IF NOT EXISTS employees (
    cpf_No INT PRIMARY KEY,
    name VARCHAR(255),
    designation VARCHAR(255),
    image LONGBLOB
  )
`, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  }
});

// Configure Multer for handling image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API endpoint for adding employee details along with an image
app.post('/addEmployeeDetails', upload.single('image'), (req, res) => {
  const { cpf_No, name, designation } = req.body;
  const image = req.file.buffer; // Get image data from the request

  db.query(`
    INSERT INTO employees (cpf_No, name, designation, image)
    VALUES (?, ?, ?, ?)
  `, [cpf_No, name, designation, image], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ message: 'Employee details added successfully' });
  });
});


// API endpoint for fetching employee details based on name
app.post('/getEmployeeDetailsByName', (req, res) => {
  const { employeeName } = req.body;

  db.query(`
    SELECT cpf_No, name, designation, image, unit FROM employees WHERE name LIKE ?
  `, [`%${employeeName}%`], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No employees found' });
    }

    // Convert the results to an array of employee objects
    const employees = results.map(row => {
      // Send the image data as base64
      const imageBase64 = row.image ? row.image.toString('base64') : null;

      return {
        cpf_No: row.cpf_No,
        name: row.name,
        designation: row.designation,
        image: imageBase64,
        unit: row.unit,
      };
    });

    res.json(employees);
  });
});

// API endpoint for updating employee details based on CPF number
app.post('/updateEmployeeDetails', upload.single('image'), (req, res) => {
  const {cpf_No} = req.body;
  const image = req.file.buffer; // Get image data from the request

  // Check if the employee with the given CPF number exists
  db.query('SELECT * FROM employees WHERE cpf_No = ?', [cpf_No], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Employee exists, proceed with the update
    db.query(`
      UPDATE employees
      SET image = ?
      WHERE cpf_No = ?
    `, [image, cpf_No], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: 'Employee details updated successfully' });
    });
  });
});

// API endpoint for deleting an employee based on CPF number
app.post('/deleteEmployee', (req, res) => {
  const { cpf_No } = req.body;

  // Check if the employee with the given CPF number exists
  db.query('SELECT * FROM employees WHERE cpf_No = ?', [cpf_No], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Employee exists, proceed with the deletion
    db.query('DELETE FROM employees WHERE cpf_No = ?', [cpf_No], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: 'Employee deleted successfully' });
    });
  });
});

// API endpoint for fetching employee details along with the image
app.post('/getEmployeeDetails', (req, res) => {
  const { employeeId } = req.body;

  db.query(`
    SELECT cpf_No, name, designation, image, phone_No, email_Id, unit, doj, dob, gender, grade, status FROM employees WHERE cpf_No = ?
  `, [employeeId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const row = results[0];
    // Send the image data as base64
    const imageBase64 = row.image ? row.image.toString('base64') : null;

    res.json({
      cpf_No: row.cpf_No,
      name: row.name,
      designation: row.designation,
      image: imageBase64,
      phone_No: row.phone_No,
      email_Id: row.email_Id,
      unit: row.unit,
      doj: row.doj,
      dob: row.dob,
      gender: row.gender,
      grade: row.grade,
      status: row.status,
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
