import { executeQuery } from '../server/index.js';

async function checkCounters() {
    try {
        console.log('--- CHECKING TRANSCODE COUNTERS ---');

        // Get all Transcodes
        const transcodes = await executeQuery('SELECT * FROM Transcodes');

        for (const tc of transcodes) {
            console.log(`Checking Transcode: ${tc.code} (${tc.name}) - Last Number: ${tc.last_number}`);

            // Try to guess table from usage.
            // Usually JV uses these.
            // Check JournalVouchers
            // Pattern matching: Prefix
            const prefix = tc.prefix;
            if (!prefix) continue;

            // Find max doc number provided it matches prefix
            // This is heuristic.
            const jvs = await executeQuery(`SELECT doc_number FROM JournalVouchers WHERE doc_number LIKE '${prefix}%' ORDER BY doc_number DESC`);

            if (jvs.length > 0) {
                const maxDoc = jvs[0].doc_number;
                console.log(`  -> Found in JournalVouchers: Max Doc ${maxDoc}`);

                // Extract sequence assuming typical format .../SEQ
                // This is tricky if format varies.
                // But we can just see if we have many.
            }
        }

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

setTimeout(checkCounters, 1000);
