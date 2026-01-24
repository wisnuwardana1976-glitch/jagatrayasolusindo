import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function alterTranscodesTable() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Adding nomortranscode column to Transcodes table...');

        try {
            await conn.query(`ALTER TABLE Transcodes ADD nomortranscode INTEGER DEFAULT NULL`);
            console.log('✅ Column nomortranscode added successfully');

            // Update existing records with default mapping if possible (Optional, logic can be added here)
            // For now we leave them null or user can update manually

        } catch (e) {
            console.log('❌ Error (Column might already exist):', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

alterTranscodesTable();
