import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function recreateYearSetupTable() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Drop table if exists
        try {
            await connection.query('DROP TABLE IF EXISTS YearSetups');
            console.log('Dropped YearSetups table');
        } catch (e) {
            console.log('Table YearSetups might not exist, skipping drop');
        }

        // Create table
        await connection.query(`
            CREATE TABLE YearSetups (
                id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                yearid INTEGER NOT NULL UNIQUE
            )
        `);
        console.log('Created YearSetups table');

        // Insert initial data
        const currentYear = new Date().getFullYear();
        await connection.query(`INSERT INTO YearSetups (yearid) VALUES (${currentYear})`);
        console.log(`Inserted initial year: ${currentYear}`);

        // Verify
        const result = await connection.query('SELECT * FROM YearSetups');
        console.log('Current data:', result);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

recreateYearSetupTable();
