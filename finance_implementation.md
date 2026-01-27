
# Finance Module Implementation

## New Features
1. **Journal Voucher (JV)**
   - Path: `src/pages/finance/JournalVoucherList.jsx`
   - Features: Create/Edit/Delete Manual Journals, Post/Unpost status, Balance Validation.
   - Backend API: `POST /api/journals`, `PUT`, `DELETE`.

2. **Cash Transactions (Menu Split)**
   - **Cash In**: For incoming cash (Debit Cash Account).
   - **Cash Out**: For outgoing cash (Credit Cash Account).
   - Path: `src/pages/finance/CashList.jsx` handles both via `transactionType` prop.
   - Sidebar updated to show distinct menus.
   - **Transcode Logic**: Uses `nomortranscode` **10** (Cash In) and **11** (Cash Out).

3. **Bank Transactions (Menu Split)**
   - **Bank In**: For incoming bank transfers (Debit Bank Account).
   - **Bank Out**: For outgoing bank transfers (Credit Bank Account).
   - Path: `src/pages/finance/BankList.jsx` handles both via `transactionType` prop.
   - Sidebar updated to show distinct menus.
   - **Transcode Logic**: Uses `nomortranscode` **12** (Bank In) and **13** (Bank Out). Matches against Master Data to find correct `transcode_id`.

4. **Giro/Check Integration**
   - **Columns**: `is_giro`, `giro_number`, `giro_due_date` added to `JournalVoucher`.
   - **UI**: Checkbox "Gunakan Giro/Cek" enables input fields in Cash/Bank forms.
   - **Backend**: API updated to accept and save these fields.

## Backend Changes
- Added CRUD endpoints for `JournalVouchers` in `server/index.js`.
- Added logic for balance validation (Math.abs < 0.01).
- Added logic for Posting/Unposting (changing status).
- **Migration**: Added new columns via script `scripts/add-giro-columns.js`.
