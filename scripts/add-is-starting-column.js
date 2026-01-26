// Script to add is_starting column to AccountingPeriods table
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addIsStartingColumn() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Try to add the column
        try {
            await connection.query("ALTER TABLE AccountingPeriods ADD is_starting VARCHAR(1) DEFAULT 'N'");
            console.log('✅ Column is_starting added successfully');
        } catch (error) {
            if (error.message.includes('already exists') || error.message.includes('Column')) {
                console.log('ℹ️ Column is_starting already exists');
            } else {
                throw error;
            }
        }

        console.log('Done!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

addIsStartingColumn();
