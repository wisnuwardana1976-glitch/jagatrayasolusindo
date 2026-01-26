// Script to cleanup orphaned journal headers and re-trigger journal creation
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function cleanupAndRecreate() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Step 1: Find orphaned journals (headers without details)
        console.log('\n=== Step 1: Finding orphaned journals ===');
        const orphanedJournals = await connection.query(`
            SELECT jv.id, jv.doc_number, jv.source_type, jv.ref_id
            FROM JournalVouchers jv
            LEFT JOIN JournalVoucherDetails jvd ON jv.id = jvd.jv_id
            WHERE jvd.id IS NULL
        `);
        console.log(`Found ${orphanedJournals.length} orphaned journals:`);
        orphanedJournals.forEach(j => console.log(`  ID: ${j.id}, DocNum: ${j.doc_number}, Source: ${j.source_type}, RefID: ${j.ref_id}`));

        // Step 2: Delete orphaned journals (they'll be recreated when approve is triggered)
        if (orphanedJournals.length > 0) {
            console.log('\n=== Step 2: Deleting orphaned journals ===');
            for (const j of orphanedJournals) {
                await connection.query('DELETE FROM JournalVouchers WHERE id = ?', [j.id]);
                console.log(`  Deleted JV ID: ${j.id}`);
            }
        }

        // Step 3: Find approved receivings that need journals
        console.log('\n=== Step 3: Finding approved receivings without journals ===');
        const receivingsNeedingJournals = await connection.query(`
            SELECT r.id, r.doc_number, r.doc_date
            FROM Receivings r
            WHERE r.status = 'Approved'
            AND NOT EXISTS (
                SELECT 1 FROM JournalVouchers jv 
                WHERE jv.source_type = 'Receiving' AND jv.ref_id = r.id
            )
        `);
        console.log(`Found ${receivingsNeedingJournals.length} receivings needing journals:`);
        receivingsNeedingJournals.forEach(r => console.log(`  ID: ${r.id}, DocNum: ${r.doc_number}`));

        console.log('\n=== Done! ===');
        console.log('To create journals, either:');
        console.log('1. Call the approve API endpoint again for each receiving');
        console.log('2. Or manually trigger journal creation');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

cleanupAndRecreate();
