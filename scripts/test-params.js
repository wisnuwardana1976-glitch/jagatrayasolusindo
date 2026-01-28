import { executeQuery } from '../server/index.js';

async function run() {
    try {
        console.log('--- TEST PARAMS ---');
        const docNum = `TEST/${Date.now()}`;

        // 1. Minimal
        console.log('1. Testing Minimal Params...');
        const transcode = (await executeQuery("SELECT id FROM Transcodes WHERE nomortranscode = 12"))[0].id; // 12 = Bank In

        const params1 = [docNum, "2026-01-28", "Test Minimal", transcode, 0, null, null, null];
        await executeQuery(
            `INSERT INTO JournalVouchers (doc_number, doc_date, description, status, transcode_id, source_type, is_giro, giro_number, giro_due_date, giro_bank_name) 
              VALUES (?, ?, ?, 'Draft', ?, 'MANUAL', ?, ?, ?, ?)`,
            params1
        );
        console.log('✅ Minimal Success');

        // 2. With is_giro = 1 but null dates
        console.log('2. Testing is_giro=1, null dates...');
        const docNum2 = `TEST/${Date.now()}_2`;
        const params2 = [docNum2, "2026-01-28", "Test Giro", transcode, 1, null, null, null];
        await executeQuery(
            `INSERT INTO JournalVouchers (doc_number, doc_date, description, status, transcode_id, source_type, is_giro, giro_number, giro_due_date, giro_bank_name) 
              VALUES (?, ?, ?, 'Draft', ?, 'MANUAL', ?, ?, ?, ?)`,
            params2
        );
        console.log('✅ Giro Nulls Success');

        // 3. With Date
        console.log('3. Testing Date...');
        const docNum3 = `TEST/${Date.now()}_3`;
        const params3 = [docNum3, "2026-01-28", "Test Date", transcode, 1, null, "2026-01-30", null];
        await executeQuery(
            `INSERT INTO JournalVouchers (doc_number, doc_date, description, status, transcode_id, source_type, is_giro, giro_number, giro_due_date, giro_bank_name) 
              VALUES (?, ?, ?, 'Draft', ?, 'MANUAL', ?, ?, ?, ?)`,
            params3
        );
        console.log('✅ Date Success');

        // 4. Test Details Insert
        console.log('4. Testing Details Insert...');
        const jvIdRes = await executeQuery("SELECT MAX(id) as id FROM JournalVouchers");
        const jvId = jvIdRes[0].id;

        const piutangAcc = (await executeQuery("SELECT id FROM Accounts WHERE code LIKE '%1003.001%'"))[0].id;
        const invId = 27; // From previous context

        // Params: jv_id, coa_id, description, debit, credit, ref_id, ref_type
        const detParams = [jvId, piutangAcc, "Test Detail", 0, 77000, invId, "AR"];

        await executeQuery(
            `INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit, ref_id, ref_type) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            detParams
        );
        console.log('✅ Details Success');

        // 5. Test Giro Bank Name String
        console.log('5. Testing Giro Bank Name String...');
        const docNum5 = `TEST/${Date.now()}_5`;
        // [docNum, doc_date, description, transcode_id, is_giro (1), giro_number ("G1"), giro_due_date ("2026-01-28"), giro_bank_name ("BCA")]
        const params5 = [docNum5, "2026-01-28", "Test Bank", transcode, 1, "G1", "2026-01-28", "BCA"];
        await executeQuery(
            `INSERT INTO JournalVouchers (doc_number, doc_date, description, status, transcode_id, source_type, is_giro, giro_number, giro_due_date, giro_bank_name) 
              VALUES (?, ?, ?, 'Draft', ?, 'MANUAL', ?, ?, ?, ?)`,
            params5
        );
        console.log('✅ Bank Name Success');

        process.exit(0);
    } catch (e) {
        console.error('❌ FAILED with:', e);
        if (e.odbcErrors) console.error('ODBC:', JSON.stringify(e.odbcErrors));
        process.exit(1);
    }
}

setTimeout(run, 1000);
