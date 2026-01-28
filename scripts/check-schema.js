import { executeQuery } from '../server/index.js';

async function run() {
    try {
        console.error('--- STARTING SCHEMA CHECK ---');
        const jvCols = await executeQuery("SELECT cname, coltype, length, nulls FROM SYS.SYSCOLUMNS WHERE tname = 'JournalVouchers'");
        console.error('JV COLS:', JSON.stringify(jvCols, null, 2)); // Use console.error to ensure stderr output
        process.exit(0);
    } catch (e) {
        console.error('SCHEMA ERROR:', e);
        process.exit(1);
    }
}

// Give server 1 sec to init
setTimeout(run, 1000);
