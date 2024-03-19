

const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const { Client } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});
client.connect();

const csvFilePath = process.env.CSV_FILE_PATH;

app.use(express.json());

app.post('/upload', (req, res) => {
  const results = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      const jsonData = results.map((row) => {
        const obj = {
          name: {
            firstName: row['name.firstName'],
            lastName: row['name.lastName'],
          },
          age: parseInt(row.age),
          address: {
            line1: row['address.line1'],
            line2: row['address.line2'],
            city: row['address.city'],
            state: row['address.state'],
          },
          gender: row.gender,
        };
        return obj;
      });

      const query = {
        text: 'INSERT INTO data(data) VALUES($1)',
        values: [JSON.stringify(jsonData)],
      };

      client.query(query, (err, result) => {
        if (err) {
          console.error('Error inserting data into PostgreSQL:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          console.log('Data inserted successfully');
          res.status(200).json({ message: 'Data inserted successfully' });
        }
      });
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
