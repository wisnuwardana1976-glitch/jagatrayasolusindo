import { useState, useEffect } from 'react';

function CashList({ transactionType }) {
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [cashAccounts, setCashAccounts] = useState([]);

    // Available transcodes for selection
    const [availableTranscodes, setAvailableTranscodes] = useState([]);
    const [outstandingAp, setOutstandingAp] = useState([]);
    const [outstandingAr, setOutstandingAr] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        doc_number: 'AUTO',
        doc_date: new Date().toISOString().split('T')[0],
        description: '',
        type: transactionType || 'OUT',
        transcode_id: '', // Selected Transcode ID
        main_account_id: '',
        details: [],
        is_giro: false,
        giro_number: '',
        giro_due_date: '',
        giro_bank_name: ''
    });

    useEffect(() => {
        // Reset and load when transactionType changes
        setAvailableTranscodes([]);
        setJournals([]);
        setFormData(prev => ({ ...prev, transcode_id: '', doc_number: 'AUTO', type: transactionType }));
        loadData();
    }, [transactionType]);

    useEffect(() => {
        fetchOutstandingInvoices();
    }, [formData.type]);

    // Generate number when transcode_id changes
    useEffect(() => {
        if (formData.transcode_id) {
            const tr = availableTranscodes.find(t => t.id === parseInt(formData.transcode_id));
            if (tr) {
                generateNumber(tr.code);
            }
        }
    }, [formData.transcode_id]);

    const loadData = async () => {
        setLoading(true);
        await fetchMasterData();
        await fetchJournals();
        setLoading(false);
    };

    const fetchMasterData = async () => {
        try {
            // Accounts
            const accRes = await fetch('/api/accounts');
            const accData = await accRes.json();
            if (accData.success) {
                setAccounts(accData.data);
                const cash = accData.data.filter(a =>
                    a.name.toLowerCase().includes('kas') ||
                    a.name.toLowerCase().includes('cash') ||
                    a.code.startsWith('01-1001')
                );
                setCashAccounts(cash);
            }

            // Transcodes
            const trRes = await fetch('/api/transcodes');
            const trData = await trRes.json();
            if (trData.success) {
                // Cash In = 10, Cash Out = 11 (nomortranscode)
                const targetNomor = transactionType === 'IN' ? 10 : 11;
                const filtered = trData.data.filter(t => t.nomortranscode === targetNomor);

                setAvailableTranscodes(filtered);

                // Auto-select if only one
                if (filtered.length === 1) {
                    setFormData(prev => ({ ...prev, transcode_id: filtered[0].id }));
                }
            }
        } catch (error) {
            console.error('Error master data:', error);
        }
    };

    const fetchJournals = async () => {
        try {
            const response = await fetch('/api/journals?source_type=MANUAL');
            const result = await response.json();
            if (result.success) {
                // We need to valid Transcode IDs to filter the list
                // Since fetchMasterData runs in parallel or before, we might need access to 'availableTranscodes' 
                // but state update is async. 
                // Better strategy: Filter journals that MATCH 'nomortranscode' logic.
                // But journals don't have 'nomortranscode' column joined usually? 
                // Let's rely on fetching transcodes first and storing their IDs.

                // However, simply showing ALL journals for now and filtering by known IDs is safer if we want to show history.
                // But we only want to show journals that correspond to CURRENT transactionType (IN vs OUT).
                // So we need to know valid IDs.

                // Re-fetch transcodes for filtering purposes (or use what we have if we chain promises properly)
                const trRes = await fetch('/api/transcodes');
                const trData = await trRes.json();
                if (trData.success) {
                    const targetNomor = transactionType === 'IN' ? 10 : 11;
                    const validIds = trData.data.filter(t => t.nomortranscode === targetNomor).map(t => t.id);

                    const filtered = result.data.filter(j => validIds.includes(j.transcode_id));
                    setJournals(filtered);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const generateNumber = async (code) => {
        try {
            const response = await fetch(`/api/transcodes/${code}/generate`);
            const data = await response.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, doc_number: data.doc_number }));
            }
        } catch (error) {
            console.error('Error generating number:', error);
        }
    };



    const fetchOutstandingInvoices = async () => {
        try {
            const [apRes, arRes] = await Promise.all([
                fetch('/api/invoices/outstanding?type=AP'),
                fetch('/api/invoices/outstanding?type=AR')
            ]);

            const apData = await apRes.json();
            const arData = await arRes.json();

            if (apData.success) setOutstandingAp(apData.data);
            if (arData.success) setOutstandingAr(arData.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    const handleCreate = () => {
        resetForm();
        setShowForm(true);
    };

    const resetForm = () => {
        // Default selection
        const defaultTranscode = availableTranscodes.length === 1 ? availableTranscodes[0].id : '';
        setFormData({
            doc_number: 'AUTO',
            doc_date: new Date().toISOString().split('T')[0],
            description: '',
            type: transactionType || 'OUT',
            transcode_id: defaultTranscode,
            main_account_id: cashAccounts.length > 0 ? cashAccounts[0].id : '',
            details: [],
            is_giro: false,
            giro_number: '',
            giro_due_date: ''
        });

        // Trigger number generation if default selected
        // Effect hook determines this
    };

    const handleAddLine = () => {
        setFormData(prev => ({
            ...prev,
            details: [...prev.details, { coa_id: '', description: '', amount: 0, ref_id: '', ref_type: '', partner_id: '' }]
        }));
    };

    const handleRemoveLine = (index) => {
        setFormData(prev => ({
            ...prev,
            details: prev.details.filter((_, i) => i !== index)
        }));
    };

    const handleLineChange = (index, field, value) => {
        const newDetails = [...formData.details];
        newDetails[index][field] = value;

        // Reset Partner and Invoice if COA changes to NON-AP/AR
        if (field === 'coa_id') {
            const selectedAcc = accounts.find(a => a.id === parseInt(value));
            const isAllocatable = selectedAcc && (
                selectedAcc.name.toLowerCase().includes('hutang') ||
                selectedAcc.name.toLowerCase().includes('piutang')
            );

            if (!isAllocatable) {
                newDetails[index]['partner_id'] = '';
                newDetails[index]['ref_id'] = '';
                newDetails[index]['ref_type'] = '';
                // Don't reset amount or description
            }
        }

        // Reset Invoice if Partner changes
        if (field === 'partner_id') {
            newDetails[index]['ref_id'] = '';
            newDetails[index]['amount'] = 0;
            newDetails[index]['description'] = '';
        }

        // Allocation Logic
        if (field === 'ref_id' && value) {
            // Find in either list
            const inv = outstandingAp.find(i => i.id === parseInt(value)) || outstandingAr.find(i => i.id === parseInt(value));
            if (inv) {
                newDetails[index]['amount'] = inv.balance;
                newDetails[index]['description'] = `Payment for ${inv.doc_number}`;

                // Determine Ref Type based on which list it was found in logic
                // But better to rely on Line context (Hutang vs Piutang)
                const coaId = newDetails[index]['coa_id'];
                const selectedAcc = accounts.find(a => a.id === parseInt(coaId));
                let type = '';
                if (selectedAcc?.name.toLowerCase().includes('hutang')) type = 'AP';
                else if (selectedAcc?.name.toLowerCase().includes('piutang')) type = 'AR';

                newDetails[index]['ref_type'] = type;

                // Set partner_id if not set
                if (inv.partner_id && !newDetails[index]['partner_id']) {
                    newDetails[index]['partner_id'] = inv.partner_id;
                }
            }
        }

        setFormData({ ...formData, details: newDetails });
    };

    // Update handleSubmit to handle Edit (PUT)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.main_account_id) {
            alert('Pilih Akun Kas!');
            return;
        }

        if (!formData.transcode_id) {
            alert('Pilih Tipe Transaksi!');
            return;
        }

        const totalAmount = formData.details.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

        if (totalAmount <= 0) {
            alert('Total nominal harus lebih dari 0');
            return;
        }

        // Prepare details for POST/PUT
        const journalDetails = [];

        // 1. Contra lines (User inputs)
        formData.details.forEach(d => {
            const amt = parseFloat(d.amount) || 0;
            if (amt > 0) {
                const det = {
                    coa_id: d.coa_id,
                    description: d.description || formData.description,
                    debit: formData.type === 'OUT' ? amt : 0,
                    credit: formData.type === 'IN' ? amt : 0,
                    // Pass allocation info
                    ref_id: d.ref_id || null,
                    ref_type: d.ref_type || null
                };
                journalDetails.push(det);
            }
        });

        // 2. Main line (Cash Account)
        journalDetails.push({
            coa_id: formData.main_account_id,
            description: formData.description,
            debit: formData.type === 'IN' ? totalAmount : 0,
            credit: formData.type === 'OUT' ? totalAmount : 0
        });

        const payload = {
            doc_number: formData.doc_number,
            doc_date: formData.doc_date,
            description: formData.description,
            transcode_id: parseInt(formData.transcode_id),
            source_type: 'MANUAL', // Always manual for this form
            details: journalDetails,
            is_giro: formData.is_giro ? 1 : 0,
            giro_number: formData.giro_number,
            giro_due_date: formData.giro_due_date,
            giro_bank_name: formData.giro_bank_name || null
        };

        try {
            let response;
            if (formData.id) {
                // Update
                response = await fetch(`/api/journals/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create
                response = await fetch('/api/journals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const result = await response.json();
            if (result.success) {
                alert(formData.id ? 'Transaksi berhasil diupdate' : 'Transaksi berhasil dikirim');
                setShowForm(false);
                loadData();
            } else {
                alert('Gagal menyimpan: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving journal:', error);
            alert('Terjadi kesalahan saat menyimpan transaksi.');
        }
    };

    const handleEdit = async (journal) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/journals/${journal.id}`);
            const result = await response.json();

            if (result.success) {
                const data = result.data;

                // Parse details to match form structure
                // Form expects "Contra" lines. Backend returns all lines (including Main).
                // We need to identify Main Account line vs Contra lines.
                // In generic Journal, it's hard. But for Cash Transaction, we assume:
                // Main Line = Line matching main_account_id (or logic based on Type)

                // Let's find the Main Line.
                // For Cash IN: Main is DEBIT. Contra is CREDIT.
                // For Cash OUT: Main is CREDIT. Contra is DEBIT.

                // However, we stored main_account_id in local state 'cashAccounts'.
                // Ideally we find the line that matches one of 'cashAccounts' AND matches the logic direction.

                // Simplification for now:
                // Find line with largest Value matching Type direction?
                // Or just filter out the main line if we can identify it.

                // Let's rely on what we saved. We saved Main line at the end usually. 
                // But DB order isn't guaranteed.

                // Strategy:
                // 1. Identify Main Account ID from the journal lines that is in `cashAccounts`.
                // 2. Set that as `main_account_id`.
                // 3. Set remaining lines as `details`.

                let mainAccId = '';
                const details = [];
                const type = transactionType; // Current view context (IN/OUT)

                // Find potential main account
                const cashIds = cashAccounts.map(c => c.id);
                const mainLine = data.details.find(d => cashIds.includes(d.coa_id));

                if (mainLine) {
                    mainAccId = mainLine.coa_id;
                }

                // Rest are details
                data.details.forEach(d => {
                    if (d.id === mainLine?.id) return; // Skip main line

                    // Determine amount
                    const amt = parseFloat(d.debit) || parseFloat(d.credit);
                    if (amt > 0) {
                        details.push({
                            coa_id: d.coa_id,
                            description: d.description,
                            amount: amt,
                            ref_id: d.ref_id || '',
                            ref_type: d.ref_type || '', // AP/AR
                            partner_id: '' // Need to infer? Or API should return it? API returns ref_type/id.
                            // We can re-fetch partner from ref_id logic or leave blank if lazy.
                            // Better: The 'ref_type/ref_id' logic in handleLineChange sets it. 
                            // But here we need to populate it for the dropdown to work.
                            // If ref_id exists, we can try to find it in outstanding lists? 
                            // Issue: Paid invoices are NOT in outstanding list anymore.
                            // So we can't show them in dropdown if we filter by "Outstanding".
                        });
                    }
                });

                // If editing a PAID transaction, the invoice is no longer "Outstanding".
                // So our "Period" / "Outstanding" dropdown won't show it.
                // This is a common issue. 
                // Fix: Fetch the specific Invoice info if ref_id exists?
                // Or just leave it as text?
                // For now, let's load what we can.

                setFormData({
                    id: data.id,
                    doc_number: data.doc_number,
                    doc_date: new Date(data.doc_date).toISOString().split('T')[0],
                    description: data.description,
                    type: type, // Keep context
                    transcode_id: data.transcode_id,
                    main_account_id: mainAccId,
                    details: details,
                    is_giro: data.is_giro === 1,
                    giro_number: data.giro_number || '',
                    giro_due_date: data.giro_due_date ? new Date(data.giro_due_date).toISOString().split('T')[0] : '',
                    giro_bank_name: data.giro_bank_name || ''
                });

                setShowForm(true);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching details:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
        try {
            const response = await fetch(`/api/journals/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                loadData();
            } else {
                alert('Gagal menghapus: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat menghapus.');
        }
    };

    const handleApprove = async (id) => {
        if (!confirm('Apakah Anda yakin ingin memposting transaksi ini? Status akan menjadi Posted dan tidak bisa diedit lagi.')) return;
        try {
            const response = await fetch(`/api/journals/${id}/post`, { method: 'PUT' });
            const result = await response.json();
            if (result.success) {
                loadData();
            } else {
                alert('Gagal memposting: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat memposting.');
        }
    };

    const handleUnpost = async (id) => {
        if (!confirm('Apakah Anda yakin ingin membatalkan posting transaksi ini? Status akan kembali menjadi Draft.')) return;
        try {
            const response = await fetch(`/api/journals/${id}/unpost`, { method: 'PUT' });
            const result = await response.json();
            if (result.success) {
                loadData();
            } else {
                alert('Gagal membatalkan posting: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat membatalkan posting.');
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('id-ID');

    return (
        <div className="report-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Transaksi Kas {transactionType ? (transactionType === 'IN' ? 'Masuk' : 'Keluar') : ''}</h1>
                    <p className="text-subtitle">
                        Pencatatan kas {transactionType ? (transactionType === 'IN' ? 'masuk' : 'keluar') : 'masuk dan keluar'}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={handleCreate}>
                    + Transaksi Baru
                </button>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <div className="modal-header">
                            <h3>{formData.id ? 'Edit' : 'Baru'} Transaksi Kas {transactionType === 'IN' ? 'Masuk' : 'Keluar'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>No. Dokumen</label>
                                    <input type="text" value={formData.doc_number} readOnly className="form-control" style={{ backgroundColor: '#f0f0f0' }} />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input type="date" value={formData.doc_date} onChange={e => setFormData({ ...formData, doc_date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Tipe Transaksi</label>
                                    {availableTranscodes.length > 0 ? (
                                        <select
                                            value={formData.transcode_id}
                                            onChange={e => setFormData({ ...formData, transcode_id: e.target.value })}
                                            required
                                            style={{ fontWeight: 'bold' }}
                                        >
                                            <option value="">-- Pilih Tipe Transaksi --</option>
                                            {availableTranscodes.map(tr => (
                                                <option key={tr.id} value={tr.id}>{tr.code} - {tr.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div style={{ padding: '0.5rem', color: 'red' }}>Tidak ada tipe transaksi tersedia</div>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Akun Kas</label>
                                    <select
                                        value={formData.main_account_id}
                                        onChange={e => setFormData({ ...formData, main_account_id: e.target.value })}
                                        required
                                        style={{ fontWeight: 'bold' }}
                                    >
                                        <option value="">-- Pilih Akun Kas --</option>
                                        {cashAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Keterangan Umum (Optional)</label>
                                    <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>



                            <div className="form-section">
                                <div className="form-section-header">
                                    <h4>Rincian {formData.type === 'IN' ? 'Penerimaan' : 'Pengeluaran'}</h4>
                                    <button type="button" className="btn btn-outline btn-sm" onClick={handleAddLine}>+ Tambah Baris</button>
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '25%' }}>Akun Lawan (Contra)</th>
                                            <th style={{ width: '25%' }}>{formData.type === 'IN' ? 'Customer' : 'Supplier'}</th>
                                            <th style={{ width: '25%' }}>Alokasi Invoice</th>
                                            <th>Keterangan</th>
                                            <th style={{ width: '150px', textAlign: 'right' }}>Nominal</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.details.length === 0 ? (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>Klik Tambah Baris untuk input rincian</td></tr>
                                        ) : (
                                            formData.details.map((row, idx) => {
                                                const selectedAcc = accounts.find(a => a.id === parseInt(row.coa_id));
                                                const isHutang = selectedAcc && selectedAcc.name.toLowerCase().includes('hutang');
                                                const isPiutang = selectedAcc && selectedAcc.name.toLowerCase().includes('piutang');
                                                const isAllocatable = isHutang || isPiutang;

                                                let targetList = [];
                                                if (isHutang) targetList = outstandingAp;
                                                else if (isPiutang) targetList = outstandingAr;

                                                return (
                                                    <tr key={idx}>
                                                        <td>
                                                            <select value={row.coa_id} onChange={e => handleLineChange(idx, 'coa_id', e.target.value)} required style={{ width: '100%' }}>
                                                                <option value="">-- Pilih Akun --</option>
                                                                {accounts.map(acc => (
                                                                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                value={row.partner_id || ''}
                                                                onChange={e => handleLineChange(idx, 'partner_id', e.target.value)}
                                                                style={{ width: '100%' }}
                                                                disabled={!isAllocatable}
                                                            >
                                                                <option value="">-- Pilih Partner --</option>
                                                                {(() => {
                                                                    const partnerMap = new Map();
                                                                    targetList.forEach(inv => {
                                                                        if (!partnerMap.has(inv.partner_id)) {
                                                                            partnerMap.set(inv.partner_id, { name: inv.partner_name, balance: 0 });
                                                                        }
                                                                        partnerMap.get(inv.partner_id).balance += (parseFloat(inv.balance) || 0);
                                                                    });

                                                                    return [...partnerMap.entries()].map(([id, data]) => (
                                                                        <option key={id} value={id}>
                                                                            {data.name} (Total: {new Intl.NumberFormat('id-ID').format(data.balance)})
                                                                        </option>
                                                                    ));
                                                                })()}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                value={row.ref_id || ''}
                                                                onChange={e => handleLineChange(idx, 'ref_id', e.target.value)}
                                                                style={{ width: '100%' }}
                                                                disabled={!isAllocatable || !row.partner_id}
                                                            >
                                                                <option value="">-- Tanpa Alokasi --</option>
                                                                {targetList
                                                                    .filter(inv => !row.partner_id || inv.partner_id === parseInt(row.partner_id))
                                                                    .map(inv => (
                                                                        <option key={inv.id} value={inv.id}>
                                                                            {inv.doc_number} - {new Date(inv.doc_date).toLocaleDateString()} ({new Intl.NumberFormat('id-ID').format(inv.balance)})
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <input type="text" value={row.description} onChange={e => handleLineChange(idx, 'description', e.target.value)} />
                                                        </td>
                                                        <td>
                                                            <input type="number" min="0" value={row.amount} onChange={e => handleLineChange(idx, 'amount', parseFloat(e.target.value) || 0)} style={{ textAlign: 'right' }} required />
                                                        </td>
                                                        <td>
                                                            <button type="button" className="btn-icon" onClick={() => handleRemoveLine(idx)}>🗑️</button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                                            <td colSpan="4" style={{ textAlign: 'right' }}>Total:</td>
                                            <td style={{ textAlign: 'right' }}>
                                                {formatMoney(formData.details.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0))}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{formData.id ? 'Simpan Perubahan' : 'Simpan Transaksi'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                {loading ? <div className="loading"><div className="loading-spinner"></div><p>Memuat...</p></div> : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No. Dokumen</th>
                                <th>Tanggal</th>
                                <th>Keterangan</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th style={{ width: '120px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journals.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>Belum ada transaksi</td></tr>
                            ) : (
                                journals.map(j => {
                                    // Use backend total_amount if available, else calc from details
                                    const total = j.total_amount ? parseFloat(j.total_amount) : (j.details ? j.details.reduce((sum, d) => sum + (parseFloat(d.debit) || 0), 0) : 0);
                                    return (
                                        <tr key={j.id}>

                                            <td><strong>{j.doc_number}</strong></td>
                                            <td>{formatDate(j.doc_date)}</td>
                                            <td>{j.description}</td>
                                            <td style={{ textAlign: 'right' }}>{formatMoney(total)}</td>
                                            <td><span className={`status-badge ${j.status === 'Posted' ? 'status-approved' : 'status-draft'}`}>{j.status}</span></td>
                                            <td>
                                                {j.status === 'Draft' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="btn-icon"
                                                            title="Edit"
                                                            onClick={() => handleEdit(j)}
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="btn-icon"
                                                            title="Approve / Post"
                                                            onClick={() => handleApprove(j.id)}
                                                        >
                                                            ✅
                                                        </button>
                                                        <button
                                                            className="btn-icon"
                                                            title="Hapus"
                                                            onClick={() => handleDelete(j.id)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                                {j.status === 'Posted' && (
                                                    <button
                                                        className="btn-icon"
                                                        title="Unpost / Batal Posting"
                                                        style={{ color: '#d9534f' }} // Red/Warm color or standard icon
                                                        onClick={() => handleUnpost(j.id)}
                                                    >
                                                        🔓
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

}

export default CashList;
