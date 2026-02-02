import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addColumns() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Add yearid column
        try {
            await connection.query('ALTER TABLE AccountingPeriods ADD yearid INTEGER NULL');
            console.log('Added yearid column');
        } catch (e) {
            console.log('Column yearid might already exist or error:', e.message);
        }

        // Add monthid column
        try {
            await connection.query('ALTER TABLE AccountingPeriods ADD monthid INTEGER NULL');
            console.log('Added monthid column');
        } catch (e) {
            console.log('Column monthid might already exist or error:', e.message);
        }

        // Verify
        const result = await connection.query('SELECT TOP 1 * FROM AccountingPeriods');
        console.log('Table columns:', Object.keys(result[0] || {}));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

addColumns();
