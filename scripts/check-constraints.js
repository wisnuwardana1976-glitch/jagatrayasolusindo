// Script to check table constraints
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkConstraints() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Check for Foreign Keys on JournalVoucherDetails
        const fks = await connection.query(`
            SELECT 
                fk.role as fk_name,
                pc.column_name as parent_column,
                fc.column_name as foreign_column,
                pt.table_name as parent_table
            FROM SYSFOREIGNKEY fk
            JOIN SYSTABLE ft ON fk.foreign_table_id = ft.table_id
            JOIN SYSTABLE pt ON fk.primary_table_id = pt.table_id
            JOIN SYSFKCOL fkc ON fk.foreign_table_id = fkc.foreign_table_id AND fk.foreign_key_id = fkc.foreign_key_id
            JOIN SYSCOLUMN fc ON fkc.foreign_column_id = fc.column_id AND fc.table_id = ft.table_id
            JOIN SYSCOLUMN pc ON fkc.primary_column_id = pc.column_id AND pc.table_id = pt.table_id
            WHERE ft.table_name = 'JournalVoucherDetails'
        `);

        console.log('\n=== Foreign Keys on JournalVoucherDetails ===');
        if (fks.length === 0) {
            console.log('No foreign keys found.');
        } else {
            fks.forEach(fk => console.log(`FK: ${fk.fk_name} -> ${fk.parent_table}(${fk.parent_column}) via ${fk.foreign_column}`));
        }

        // Check all constraints
        const constraints = await connection.query(`
            SELECT 
                idx.index_name,
                c.column_name,
                idx."unique"
            FROM SYSINDEX idx
            JOIN SYSTABLE t ON idx.table_id = t.table_id
            JOIN SYSIXCOL ixc ON idx.table_id = ixc.table_id AND idx.index_id = ixc.index_id
            JOIN SYSCOLUMN c ON ixc.column_id = c.column_id AND c.table_id = t.table_id
            WHERE t.table_name = 'JournalVoucherDetails'
        `);

        console.log('\n=== Indexes on JournalVoucherDetails ===');
        constraints.forEach(c => console.log(`Index: ${c.index_name}, Column: ${c.column_name}, Unique: ${c.unique}`));

        // Check for existing details
        const details = await connection.query('SELECT * FROM JournalVoucherDetails');
        console.log('\n=== Existing JournalVoucherDetails ===');
        console.log(`Count: ${details.length}`);
        details.forEach(d => console.log(`ID: ${d.id}, JV_ID: ${d.jv_id}, COA_ID: ${d.coa_id}, Debit: ${d.debit}, Credit: ${d.credit}`));

        // Try simple insert without transaction
        console.log('\n=== Testing simple insert (no transaction) ===');
        try {
            const testResult = await connection.query(
                'INSERT INTO JournalVoucherDetails (jv_id, coa_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
                [12, 8, 3000000, 0, 'Test Inventory Receipt']
            );
            console.log('Insert result:', testResult);
            console.log('Insert succeeded!');
        } catch (e) {
            console.error('Insert failed:', e.message);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

checkConstraints();
