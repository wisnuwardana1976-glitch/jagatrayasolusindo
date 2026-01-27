import { useState, useEffect } from 'react';

function JournalVoucherList() {
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [accounts, setAccounts] = useState([]);

    // Hardcoded for now, but ideally fetched. confirmed ID=9 is JV
    const [jvTranscodeId, setJvTranscodeId] = useState(9);
    const [transcodeInfo, setTranscodeInfo] = useState(null);

    const [formData, setFormData] = useState({
        doc_number: 'AUTO',
        doc_date: new Date().toISOString().split('T')[0],
        description: '',
        status: 'Draft',
        details: []
    });

    useEffect(() => {
        fetchJournals();
        fetchMasterData();
    }, []);

    const fetchJournals = async () => {
        setLoading(true);
        try {
            // Fetch all journals for now. Ideally filter by transcode_id on backend if volume is huge.
            // But API returns all. We filter in frontend or improve API.
            // API doesn't support transcode filter yet, but supports source_type='MANUAL'.
            const response = await fetch('/api/journals?source_type=MANUAL');
            const result = await response.json();
            if (result.success) {
                // Filter only Journal Voucher records (transcode_id 9)
                // Or maybe show all MANUAL journals? Let's check user intent. 
                // "Journal Voucher" usually means general journals.
                setJournals(result.data.filter(j => j.transcode_id === 9));
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchMasterData = async () => {
        try {
            const accRes = await fetch('/api/accounts');
            const accData = await accRes.json();
            if (accData.success) setAccounts(accData.data);

            const trRes = await fetch('/api/transcodes');
            const trData = await trRes.json();
            if (trData.success) {
                const jvTr = trData.data.find(t => t.nomortranscode === 9); // 9 is JV
                if (jvTr) {
                    setJvTranscodeId(jvTr.id);
                    setTranscodeInfo(jvTr);
                }
            }
        } catch (error) {
            console.error('Error master data:', error);
        }
    };

    const generateNumber = async () => {
        if (!transcodeInfo) return;
        try {
            const response = await fetch(`/api/transcodes/${transcodeInfo.code}/generate`);
            const data = await response.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, doc_number: data.doc_number }));
            }
        } catch (error) {
            console.error('Error generating number:', error);
        }
    };

    const handleCreate = () => {
        resetForm();
        setShowForm(true);
        if (transcodeInfo && formData.doc_number === 'AUTO') {
            generateNumber();
        }
    };

    const handleEdit = async (journal) => {
        try {
            const response = await fetch(`/api/journals/${journal.id}`);
            const data = await response.json();
            if (data.success) {
                const jv = data.data;
                setFormData({
                    doc_number: jv.doc_number,
                    doc_date: new Date(jv.doc_date).toISOString().split('T')[0],
                    description: jv.description,
                    status: jv.status,
                    details: jv.details.map(d => ({
                        coa_id: d.coa_id,
                        description: d.description,
                        debit: parseFloat(d.debit),
                        credit: parseFloat(d.credit)
                    }))
                });
                setEditingItem(journal.id);
                setShowForm(true);
            }
        } catch (error) {
            alert('Error fetching details: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus Jurnal ini?')) return;
        try {
            const response = await fetch(`/api/journals/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                fetchJournals();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handlePost = async (id) => {
        if (!confirm('Post Jurnal ini?')) return;
        try {
            const response = await fetch(`/api/journals/${id}/post`, { method: 'PUT' });
            const data = await response.json();
            if (data.success) {
                fetchJournals();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleUnpost = async (id) => {
        if (!confirm('Unpost Jurnal ini?')) return;
        try {
            const response = await fetch(`/api/journals/${id}/unpost`, { method: 'PUT' });
            const data = await response.json();
            if (data.success) {
                fetchJournals();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final balance check
        const totalDebit = formData.details.reduce((sum, d) => sum + (parseFloat(d.debit) || 0), 0);
        const totalCredit = formData.details.reduce((sum, d) => sum + (parseFloat(d.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            alert(`Jurnal tidak balance! Debit: ${formatMoney(totalDebit)}, Credit: ${formatMoney(totalCredit)}`);
            return;
        }

        try {
            const url = editingItem ? `/api/journals/${editingItem}` : '/api/journals';
            const method = editingItem ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                transcode_id: jvTranscodeId
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                fetchJournals();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleAddLine = () => {
        setFormData(prev => ({
            ...prev,
            details: [...prev.details, { coa_id: '', description: '', debit: 0, credit: 0 }]
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
        setFormData({ ...formData, details: newDetails });
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            doc_number: 'AUTO',
            doc_date: new Date().toISOString().split('T')[0],
            description: '',
            status: 'Draft',
            details: []
        });
        if (transcodeInfo) {
            generateNumber();
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('id-ID');

    // Display helpers
    const totalDebit = formData.details.reduce((sum, d) => sum + (parseFloat(d.debit) || 0), 0);
    const totalCredit = formData.details.reduce((sum, d) => sum + (parseFloat(d.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.01;

    return (
        <div className="report-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Jurnal Voucher (JV)</h1>
                    <p className="text-subtitle">Input dan kelola jurnal umum manual</p>
                </div>
                <button className="btn btn-primary" onClick={handleCreate}>
                    + Buat Jurnal Baru
                </button>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal modal-large" style={{ maxWidth: '900px' }}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Jurnal Voucher' : 'Buat Jurnal Voucher'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>No. Dokumen</label>
                                    <input
                                        type="text"
                                        value={formData.doc_number}
                                        readOnly
                                        className="form-control"
                                        style={{ backgroundColor: '#f0f0f0' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.doc_date}
                                        onChange={e => setFormData({ ...formData, doc_date: e.target.value })}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Deskripsi</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                        placeholder="Keterangan jurnal..."
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <div className="form-section-header">
                                    <h4>Detail Jurnal</h4>
                                    <button type="button" className="btn btn-outline btn-sm" onClick={handleAddLine} disabled={formData.status !== 'Draft'}>
                                        + Tambah Baris
                                    </button>
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '30%' }}>Akun</th>
                                            <th>Keterangan</th>
                                            <th style={{ width: '15%', textAlign: 'right' }}>Debit</th>
                                            <th style={{ width: '15%', textAlign: 'right' }}>Kredit</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.details.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>
                                                    Belum ada baris jurnal
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.details.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <select
                                                            value={row.coa_id}
                                                            onChange={e => handleLineChange(idx, 'coa_id', e.target.value)}
                                                            required
                                                            disabled={formData.status !== 'Draft'}
                                                            style={{ width: '100%' }}
                                                        >
                                                            <option value="">-- Pilih Akun --</option>
                                                            {accounts.map(acc => (
                                                                <option key={acc.id} value={acc.id}>
                                                                    {acc.code} - {acc.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={row.description}
                                                            onChange={e => handleLineChange(idx, 'description', e.target.value)}
                                                            placeholder="Keterangan baris..."
                                                            disabled={formData.status !== 'Draft'}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            value={row.debit}
                                                            onChange={e => {
                                                                handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0);
                                                                if (parseFloat(e.target.value) > 0) handleLineChange(idx, 'credit', 0);
                                                            }}
                                                            style={{ textAlign: 'right' }}
                                                            disabled={formData.status !== 'Draft'}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            value={row.credit}
                                                            onChange={e => {
                                                                handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0);
                                                                if (parseFloat(e.target.value) > 0) handleLineChange(idx, 'debit', 0);
                                                            }}
                                                            style={{ textAlign: 'right' }}
                                                            disabled={formData.status !== 'Draft'}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn-icon" onClick={() => handleRemoveLine(idx)} disabled={formData.status !== 'Draft'}>
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                                            <td colSpan="2" style={{ textAlign: 'right' }}>Total:</td>
                                            <td style={{ textAlign: 'right', color: isBalanced ? 'green' : 'red' }}>
                                                {formatMoney(totalDebit)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: isBalanced ? 'green' : 'red' }}>
                                                {formatMoney(totalCredit)}
                                            </td>
                                            <td></td>
                                        </tr>
                                        {!isBalanced && (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', color: 'red', fontWeight: 'bold' }}>
                                                    Jurnal tidak balance! Selisih: {formatMoney(Math.abs(totalDebit - totalCredit))}
                                                </td>
                                            </tr>
                                        )}
                                    </tfoot>
                                </table>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                                    Batal
                                </button>
                                {formData.status === 'Draft' && (
                                    <button type="submit" className="btn btn-primary" disabled={!isBalanced || formData.details.length === 0}>
                                        Simpan Jurnal
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List Table */}
            <div className="card">
                {loading ? (
                    <div className="loading"><div className="loading-spinner"></div><p>Memuat data...</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No. Dokumen</th>
                                <th>Tanggal</th>
                                <th>Deskripsi</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journals.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada Jurnal Voucher
                                    </td>
                                </tr>
                            ) : (
                                journals.map(jv => (
                                    <tr key={jv.id}>
                                        <td><strong>{jv.doc_number}</strong></td>
                                        <td>{formatDate(jv.doc_date)}</td>
                                        <td>{jv.description}</td>
                                        <td>
                                            <span className={`status-badge ${jv.status === 'Posted' ? 'status-approved' : 'status-draft'}`}>
                                                {jv.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {jv.status === 'Draft' ? (
                                                <>
                                                    <button className="btn-icon" onClick={() => handlePost(jv.id)} title="Post" style={{ color: 'green', marginRight: '5px' }}>✅</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(jv)} title="Edit" style={{ marginRight: '5px' }}>✏️</button>
                                                    <button className="btn-icon" onClick={() => handleDelete(jv.id)} title="Hapus">🗑️</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="btn-icon" onClick={() => handleUnpost(jv.id)} title="Unpost" style={{ color: 'orange', marginRight: '5px' }}>🔓</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(jv)} title="Lihat" style={{ color: 'blue' }}>👁️</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default JournalVoucherList;
