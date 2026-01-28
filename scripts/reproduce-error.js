import { executeQuery } from '../server/index.js';

// Mock Fetch (since we are running in node context with db access, we can call logic directly OR mock fetch)
// But better to call the DB Insert logic directly to test the SQL, OR fetch the API.
// Since server is running, let's use fetch.

async function run() {
    try {
        console.log('Gathering Data...');

        // 1. Get Accounts
        const bankAcc = (await executeQuery("SELECT id FROM Accounts WHERE code LIKE '%1002%'"))[0].id;
        const piutangAcc = (await executeQuery("SELECT id FROM Accounts WHERE code LIKE '%1003.001%'"))[0].id;

        // 2. Get Transcode (BCA Masuk)
        // Adjust filter if needed
        const transcode = (await executeQuery("SELECT id FROM Transcodes WHERE nomortranscode = 12"))[0].id; // 12 = Bank In

        // 3. Get AR Invoice
        const inv = (await executeQuery("SELECT id, total_amount, paid_amount FROM ARInvoices WHERE doc_number = 'ARI/012026/0014'"))[0];

        if (!inv) throw new Error("Invoice ARI/012026/0014 not found");

        console.log('Data:', { bankAcc, piutangAcc, transcode, invId: inv.id });

        const payload = {
            doc_number: "AUTO",
            doc_date: "2026-01-28",
            description: "Test Fix Error",
            transcode_id: transcode,
            is_giro: true, // Set to true to force date usage
            giro_number: "G123",
            giro_due_date: "2026-01-28", // Valid date
            giro_bank_name: "BCA",
            details: [
                {
                    coa_id: String(piutangAcc), // Send as string to test my fix
                    description: "Payment for ARI",
                    amount: 77700,
                    debit: 0,
                    credit: 77700, // Bank In -> Credit Piutang
                    ref_id: String(inv.id),
                    ref_type: "AR",
                    partner_id: "3" // Toko Komputer ABC
                },
                {
                    coa_id: String(bankAcc),
                    description: "Test Fix Error",
                    amount: 77700,
                    debit: 77700, // Bank In -> Debit Bank
                    credit: 0
                }
            ]
        };

        console.log('Sending Payload via fetch to localhost:3001...');

        const res = await fetch('http://localhost:3001/api/journals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Script Error:', e);
    }
}

run();
