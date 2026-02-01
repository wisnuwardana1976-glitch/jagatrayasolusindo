import { useState, useEffect } from 'react';
import { usePeriod } from '../../context/PeriodContext';

function ARAdjustmentList({ adjustmentType = 'DEBIT' }) {
    const { selectedPeriod } = usePeriod();
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [transcodes, setTranscodes] = useState([]);
    const [invoices, setInvoices] = useState([]);

    const [formData, setFormData] = useState({
        doc_number: 'AUTO',
        doc_date: new Date().toISOString().split('T')[0],
        adjustment_type: adjustmentType,
        transcode_id: '',
        partner_id: '',
        counter_account_id: '',
        amount: 0,
        notes: '',
        status: 'Draft',
        allocate_to_invoice: 'N',
        allocations: []
    });

    const title = adjustmentType === 'DEBIT' ? 'AR Debit Adjustment' : 'AR Credit Adjustment';
    const subtitle = adjustmentType === 'DEBIT' ? 'Menambah Piutang' : 'Mengurangi Piutang';

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, [selectedPeriod, adjustmentType]);

    useEffect(() => {
        if (formData.partner_id && formData.allocate_to_invoice === 'Y') {
            fetchInvoices(formData.partner_id);
        }
    }, [formData.partner_id, formData.allocate_to_invoice]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/ar-adjustments';
            const params = new URLSearchParams();
            if (selectedPeriod) {
                params.append('startDate', new Date(selectedPeriod.start_date).toISOString().split('T')[0]);
                params.append('endDate', new Date(selectedPeriod.end_date).toISOString().split('T')[0]);
            }
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setAdjustments(data.data.filter(a => a.adjustment_type === adjustmentType));
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchMasterData = async () => {
        try {
            const [custRes, accRes, transRes] = await Promise.all([
                fetch('/api/partners?type=Customer'),
                fetch('/api/accounts'),
                fetch('/api/transcodes')
            ]);
            const custData = await custRes.json();
            const accData = await accRes.json();
            const transData = await transRes.json();

            if (custData.success) setCustomers(custData.data);
            if (accData.success) setAccounts(accData.data);
            if (transData.success) {
                // Filter transcodes for AR adjustment (nomortranscode = 40 for DEBIT/IN, 41 for CREDIT/OUT)
                const transCodeNum = adjustmentType === 'DEBIT' ? 40 : 41;
                setTranscodes(transData.data.filter(t => t.active === 'Y' && t.nomortranscode === transCodeNum));
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchInvoices = async (partnerId) => {
        try {
            const response = await fetch(`/api/ar-invoices/for-allocation?partner_id=${partnerId}`);
            const data = await response.json();
            if (data.success) {
                setInvoices(data.data);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate allocation total
        if (formData.allocate_to_invoice === 'Y') {
            const totalAllocated = formData.allocations.reduce((sum, a) => sum + parseFloat(a.allocated_amount || 0), 0);
            if (Math.abs(totalAllocated - parseFloat(formData.amount)) > 0.01) {
                alert('Total alokasi harus sama dengan jumlah adjustment!');
                return;
            }
        }

        try {
            const url = editingItem ? `/api/ar-adjustments/${editingItem}` : '/api/ar-adjustments';
            const method = editingItem ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                resetForm();
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = async (id) => {
        try {
            const response = await fetch(`/api/ar-adjustments/${id}`);
            const data = await response.json();
            if (data.success) {
                const adj = data.data;
                setFormData({
                    doc_number: adj.doc_number,
                    doc_date: new Date(adj.doc_date).toISOString().split('T')[0],
                    adjustment_type: adj.adjustment_type || adj.type,
                    transcode_id: adj.transcode_id || '',
                    partner_id: adj.partner_id || '',
                    counter_account_id: adj.counter_account_id || '',
                    amount: parseFloat(adj.total_amount || adj.amount || 0),
                    notes: adj.description || adj.notes || '',
                    status: adj.status,
                    allocate_to_invoice: adj.allocate_to_invoice || 'N',
                    allocations: adj.allocations || []
                });

                if (adj.partner_id) {
                    fetchInvoices(adj.partner_id);
                }
                setEditingItem(id);
                setShowForm(true);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Adjustment ini?')) return;
        try {
            const response = await fetch(`/api/ar-adjustments/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleApprove = async (id) => {
        if (!confirm('Approve Adjustment ini?')) return;
        try {
            const response = await fetch(`/api/ar-adjustments/${id}/approve`, { method: 'PUT' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handlePost = async (id) => {
        if (!confirm('Post Adjustment ini?')) return;
        try {
            const response = await fetch(`/api/ar-adjustments/${id}/post`, { method: 'PUT' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleUnapprove = async (id) => {
        if (!confirm('Batalkan Approve Adjustment ini? Status akan kembali menjadi Draft.')) return;
        try {
            const response = await fetch(`/api/ar-adjustments/${id}/unapprove`, { method: 'PUT' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleUnpost = async (id) => {
        if (!confirm('Unpost Adjustment ini? Jurnal akan dihapus.')) return;
        try {
            const response = await fetch(`/api/ar-adjustments/${id}/unpost`, { method: 'PUT' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleAllocationChange = (invoiceId, amount) => {
        setFormData(prev => {
            const existing = prev.allocations.find(a => a.ar_invoice_id === invoiceId);
            if (existing) {
                return {
                    ...prev,
                    allocations: prev.allocations.map(a =>
                        a.ar_invoice_id === invoiceId ? { ...a, allocated_amount: parseFloat(amount) || 0 } : a
                    )
                };
            } else {
                return {
                    ...prev,
                    allocations: [...prev.allocations, { ar_invoice_id: invoiceId, allocated_amount: parseFloat(amount) || 0 }]
                };
            }
        });
    };

    const resetForm = () => {
        setEditingItem(null);
        setInvoices([]);
        setFormData({
            doc_number: 'AUTO',
            doc_date: new Date().toISOString().split('T')[0],
            adjustment_type: adjustmentType,
            transcode_id: '',
            partner_id: '',
            counter_account_id: '',
            amount: 0,
            notes: '',
            status: 'Draft',
            allocate_to_invoice: 'N',
            allocations: []
        });
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('id-ID');
    const formatMoney = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    const getStatusBadge = (status) => {
        const badges = {
            'Draft': 'badge-warning',
            'Approved': 'badge-info',
            'Posted': 'badge-success'
        };
        return badges[status] || 'badge-secondary';
    };

    const totalAllocated = formData.allocations.reduce((sum, a) => sum + parseFloat(a.allocated_amount || 0), 0);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{title}</h1>
                    <p style={{ color: '#666', margin: 0 }}>{subtitle}</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                    + Buat Adjustment Baru
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Adjustment' : 'Buat Adjustment Baru'}</h3>
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
                                        placeholder="Otomatis"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tipe Transaksi</label>
                                    <select
                                        value={formData.transcode_id}
                                        onChange={(e) => {
                                            const selectedId = parseInt(e.target.value);
                                            const selectedTranscode = transcodes.find(t => t.id === selectedId);
                                            setFormData({ ...formData, transcode_id: selectedId });
                                            if (selectedTranscode) {
                                                generateNumber(selectedTranscode.code);
                                            }
                                        }}
                                        disabled={formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Tipe --</option>
                                        {transcodes.map(t => (
                                            <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.doc_date}
                                        onChange={(e) => setFormData({ ...formData, doc_date: e.target.value })}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Customer</label>
                                    <select
                                        value={formData.partner_id}
                                        onChange={(e) => {
                                            setFormData({ ...formData, partner_id: e.target.value, allocations: [] });
                                        }}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Customer --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Counter Account (COA)</label>
                                    <select
                                        value={formData.counter_account_id}
                                        onChange={(e) => setFormData({ ...formData, counter_account_id: e.target.value })}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Akun Lawan --</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Jumlah</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Keterangan</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="2"
                                    disabled={formData.status !== 'Draft'}
                                />
                            </div>

                            {/* Invoice Allocation Section */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <h4>Alokasi ke Invoice</h4>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.allocate_to_invoice === 'Y'}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                allocate_to_invoice: e.target.checked ? 'Y' : 'N',
                                                allocations: e.target.checked ? formData.allocations : []
                                            })}
                                            disabled={formData.status !== 'Draft' || !formData.partner_id}
                                        />
                                        Alokasikan ke Invoice
                                    </label>
                                </div>

                                {formData.allocate_to_invoice === 'Y' && formData.partner_id && (
                                    <>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>No. Invoice</th>
                                                    <th>Tanggal</th>
                                                    <th>Outstanding</th>
                                                    <th style={{ width: '150px' }}>Alokasi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoices.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>
                                                            Tidak ada invoice outstanding untuk customer ini.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    invoices.map(inv => {
                                                        const allocation = formData.allocations.find(a => a.ar_invoice_id === inv.id);
                                                        return (
                                                            <tr key={inv.id}>
                                                                <td>{inv.doc_number}</td>
                                                                <td>{formatDate(inv.doc_date)}</td>
                                                                <td>{formatMoney(inv.outstanding_amount || inv.total_amount || 0)}</td>

                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="any"
                                                                        value={allocation?.allocated_amount || ''}
                                                                        onChange={(e) => handleAllocationChange(inv.id, e.target.value)}
                                                                        style={{ width: '100%' }}
                                                                        disabled={formData.status !== 'Draft'}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                    <td colSpan="3" style={{ textAlign: 'right' }}>Total Alokasi:</td>
                                                    <td style={{ color: Math.abs(totalAllocated - formData.amount) < 0.01 ? 'green' : 'red' }}>
                                                        {formatMoney(totalAllocated)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                        {Math.abs(totalAllocated - formData.amount) > 0.01 && (
                                            <p style={{ color: 'red', marginTop: '0.5rem' }}>
                                                ⚠️ Total alokasi ({formatMoney(totalAllocated)}) harus sama dengan jumlah adjustment ({formatMoney(formData.amount)})
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                                    {formData.status !== 'Draft' ? 'Tutup' : 'Batal'}
                                </button>
                                {formData.status === 'Draft' && (
                                    <button type="submit" className="btn btn-primary">
                                        {editingItem ? 'Update Adjustment' : 'Simpan Adjustment'}
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
                                <th>Tanggal</th>
                                <th>No. Dokumen</th>
                                <th>Customer</th>
                                <th>Jumlah</th>
                                <th>Counter Account</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adjustments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada Adjustment</td>
                                </tr>
                            ) : (
                                adjustments.map(adj => (
                                    <tr key={adj.id}>
                                        <td>{formatDate(adj.doc_date)}</td>
                                        <td><strong>{adj.doc_number}</strong></td>
                                        <td>{adj.partner_name || '-'}</td>
                                        <td>{formatMoney(adj.total_amount || adj.amount || 0)}</td>
                                        <td>{adj.counter_account_name || '-'}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(adj.status)}`}>
                                                {adj.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {adj.status === 'Draft' && (
                                                <>
                                                    <button className="btn-icon" onClick={() => handleApprove(adj.id)} title="Approve" style={{ color: 'blue', marginRight: '5px' }}>✓</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(adj.id)} title="Edit" style={{ marginRight: '5px' }}>✏️</button>
                                                    <button className="btn-icon" onClick={() => handleDelete(adj.id)} title="Hapus">🗑️</button>
                                                </>
                                            )}
                                            {adj.status === 'Approved' && (
                                                <>
                                                    <button className="btn-icon" onClick={() => handlePost(adj.id)} title="Post" style={{ color: 'green', marginRight: '5px' }}>✅</button>
                                                    <button className="btn-icon" onClick={() => handleUnapprove(adj.id)} title="Batal Approve" style={{ color: 'red', marginRight: '5px' }}>✕</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(adj.id)} title="Lihat Detail" style={{ color: 'blue' }}>👁️</button>
                                                </>
                                            )}
                                            {adj.status === 'Posted' && (
                                                <>
                                                    <button className="btn-icon" onClick={() => handleUnpost(adj.id)} title="Unpost" style={{ color: 'orange', marginRight: '5px' }}>↩️</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(adj.id)} title="Lihat Detail" style={{ color: 'blue' }}>👁️</button>
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

export default ARAdjustmentList;
