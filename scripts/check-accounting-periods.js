// Script to check AccountingPeriods table structure
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkTable() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Check if table exists
        const tables = await connection.query(`
            SELECT table_name FROM SYSTABLE 
            WHERE table_name = 'AccountingPeriods'
        `);

        if (tables.length === 0) {
            console.log('❌ Table AccountingPeriods does NOT exist!');
            console.log('Creating table...');

            await connection.query(`
                CREATE TABLE AccountingPeriods (
                    id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                    code VARCHAR(50) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    status VARCHAR(20) DEFAULT 'Open',
                    active VARCHAR(1) DEFAULT 'Y',
                    is_starting VARCHAR(1) DEFAULT 'N',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Table created successfully!');
        } else {
            console.log('✅ Table AccountingPeriods exists');

            // Get columns
            const cols = await connection.query(`
                SELECT c.column_name, d.domain_name 
                FROM SYSCOLUMN c 
                JOIN SYSDOMAIN d ON c.domain_id = d.domain_id 
                JOIN SYSTABLE t ON c.table_id = t.table_id 
                WHERE t.table_name = 'AccountingPeriods' 
                ORDER BY c.column_id
            `);

            console.log('\nColumns:');
            cols.forEach(c => console.log(`  - ${c.column_name}: ${c.domain_name}`));
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

checkTable();
