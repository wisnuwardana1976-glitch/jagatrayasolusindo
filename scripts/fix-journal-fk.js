// Script to fix FK constraint - change from ChartOfAccounts to Accounts
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixForeignKey() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Step 1: Drop the existing FK to ChartOfAccounts
        console.log('\n=== Step 1: Dropping FK to ChartOfAccounts ===');
        try {
            await connection.query('ALTER TABLE JournalVoucherDetails DROP FOREIGN KEY ChartOfAccounts');
            console.log('FK dropped successfully.');
        } catch (e) {
            console.log('Error dropping FK (may not exist):', e.message);
        }

        // Step 2: Add new FK to Accounts table
        console.log('\n=== Step 2: Adding FK to Accounts ===');
        try {
            await connection.query('ALTER TABLE JournalVoucherDetails ADD FOREIGN KEY Accounts (coa_id) REFERENCES Accounts (id)');
            console.log('FK to Accounts added successfully.');
        } catch (e) {
            console.log('Error adding FK:', e.message);
        }

        // Step 3: Test insert
        console.log('\n=== Step 3: Testing insert ===');
        try {
            await connection.query('BEGIN TRANSACTION');
            await connection.query(
                'INSERT INTO JournalVoucherDetails (jv_id, coa_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
                [12, 8, 3000000, 0, 'Inventory Receipt']
            );
            console.log('Insert SUCCESS!');
            await connection.query('ROLLBACK'); // Rollback test
            console.log('Test rolled back.');
        } catch (e) {
            console.error('Insert failed:', e.message);
            await connection.query('ROLLBACK');
        }

        // Step 4: Verify new FK
        console.log('\n=== Step 4: Verifying FK ===');
        const fkDetails = await connection.query(`
            SELECT 
                fk.role as fk_name,
                pt.table_name as parent_table
            FROM SYSFOREIGNKEY fk
            JOIN SYSTABLE ft ON fk.foreign_table_id = ft.table_id
            JOIN SYSTABLE pt ON fk.primary_table_id = pt.table_id
            WHERE ft.table_name = 'JournalVoucherDetails'
        `);
        fkDetails.forEach(fk => console.log(`FK: ${fk.fk_name} -> ${fk.parent_table}`));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

fixForeignKey();
