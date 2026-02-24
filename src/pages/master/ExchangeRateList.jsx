import { useState, useEffect } from 'react';

function ExchangeRateList() {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rateTypes, setRateTypes] = useState([]);
    const [currencies, setCurrencies] = useState([]);

    // Master form
    const [showForm, setShowForm] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [formData, setFormData] = useState({
        rate_type_id: '', from_date: '', to_date: '', description: '', status: 'A'
    });

    // Detail (lines)
    const [selectedRate, setSelectedRate] = useState(null);
    const [lines, setLines] = useState([]);
    const [showLineForm, setShowLineForm] = useState(false);
    const [editingLine, setEditingLine] = useState(null);
    const [lineFormData, setLineFormData] = useState({
        from_currency_id: '', to_currency_id: '', rate: ''
    });

    // Confirm modal
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

    // Search/filter
    const [filterType, setFilterType] = useState('');
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchRates();
        fetchRateTypes();
        fetchCurrencies();
    }, []);

    const fetchRates = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/exchange-rates');
            const data = await response.json();
            if (data.success) setRates(data.data);
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    };

    const fetchRateTypes = async () => {
        try {
            const response = await fetch('/api/exchange-rate-types');
            const data = await response.json();
            if (data.success) setRateTypes(data.data);
        } catch (error) { console.error('Error:', error); }
    };

    const fetchCurrencies = async () => {
        try {
            const response = await fetch('/api/currencies');
            const data = await response.json();
            if (data.success) setCurrencies(data.data);
        } catch (error) { console.error('Error:', error); }
    };

    const fetchLines = async (rateId) => {
        try {
            const response = await fetch(`/api/exchange-rates/${rateId}/lines`);
            const data = await response.json();
            if (data.success) setLines(data.data);
        } catch (error) { console.error('Error:', error); }
    };

    // Master CRUD
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingRate ? `/api/exchange-rates/${editingRate.id}` : '/api/exchange-rates';
            const method = editingRate ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                setEditingRate(null);
                resetForm();
                fetchRates();
                // Auto-select newly created rate
                if (!editingRate && data.data?.id) {
                    const newRate = { id: data.data.id, ...formData };
                    setSelectedRate(newRate);
                    fetchLines(data.data.id);
                }
            } else { alert('Error: ' + data.error); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const handleEdit = (rate) => {
        setEditingRate(rate);
        setFormData({
            rate_type_id: rate.rate_type_id,
            from_date: rate.from_date ? rate.from_date.split('T')[0] : '',
            to_date: rate.to_date ? rate.to_date.split('T')[0] : '',
            description: rate.description || '',
            status: rate.status || 'A'
        });
        setShowForm(true);
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            message: 'Yakin ingin menghapus Exchange Rate ini beserta semua detail rate-nya?',
            onConfirm: async () => {
                try {
                    const response = await fetch(`/api/exchange-rates/${id}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                        alert(data.message);
                        if (selectedRate && selectedRate.id === id) {
                            setSelectedRate(null);
                            setLines([]);
                        }
                        fetchRates();
                    } else { alert('Error: ' + data.error); }
                } catch (error) { alert('Error: ' + error.message); }
                setConfirmModal({ show: false, message: '', onConfirm: null });
            }
        });
    };

    const resetForm = () => {
        setFormData({ rate_type_id: '', from_date: '', to_date: '', description: '', status: 'A' });
    };

    // Line CRUD
    const handleLineSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingLine
                ? `/api/exchange-rate-lines/${editingLine.id}`
                : `/api/exchange-rates/${selectedRate.id}/lines`;
            const method = editingLine ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lineFormData)
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowLineForm(false);
                setEditingLine(null);
                resetLineForm();
                fetchLines(selectedRate.id);
                fetchRates(); // Update line_count
            } else { alert('Error: ' + data.error); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const handleEditLine = (line) => {
        setEditingLine(line);
        setLineFormData({
            from_currency_id: line.from_currency_id,
            to_currency_id: line.to_currency_id,
            rate: line.rate
        });
        setShowLineForm(true);
    };

    const handleDeleteLine = (id) => {
        setConfirmModal({
            show: true,
            message: 'Yakin ingin menghapus rate line ini?',
            onConfirm: async () => {
                try {
                    const response = await fetch(`/api/exchange-rate-lines/${id}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                        fetchLines(selectedRate.id);
                        fetchRates();
                    }
                } catch (error) { alert('Error: ' + error.message); }
                setConfirmModal({ show: false, message: '', onConfirm: null });
            }
        });
    };

    const resetLineForm = () => {
        setLineFormData({ from_currency_id: '', to_currency_id: '', rate: '' });
    };

    const handleSelectRate = (rate) => {
        setSelectedRate(rate);
        fetchLines(rate.id);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '-';
        return parseFloat(num).toLocaleString('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    };

    // Filter rates
    const filteredRates = rates.filter(r => {
        if (filterType && r.rate_type_id !== parseInt(filterType)) return false;
        if (searchText) {
            const s = searchText.toLowerCase();
            return (r.rate_type_code || '').toLowerCase().includes(s) ||
                (r.description || '').toLowerCase().includes(s) ||
                String(r.id).includes(s);
        }
        return true;
    });

    const getStatusBadge = (status) => {
        if (status === 'A') return { label: 'Active', color: '#10b981' };
        if (status === 'C') return { label: 'Closed', color: '#6366f1' };
        return { label: 'Inactive', color: '#ef4444' };
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Exchange Rate</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingRate(null); resetForm(); }}>
                    + Tambah Exchange Rate
                </button>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Tipe:</label>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                            style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
                            <option value="">Semua</option>
                            {rateTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Cari:</label>
                        <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Cari ID, tipe, atau keterangan..."
                            style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', flex: 1, maxWidth: '300px' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {filteredRates.length} dari {rates.length} data
                    </span>
                </div>
            </div>

            {/* Master-Detail Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedRate ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                {/* Left Panel - Master (Periods) */}
                <div className="card">
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>📋 Daftar Exchange Rate</h3>
                    </div>
                    {loading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>Memuat data...</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '55px' }}>ID</th>
                                        <th style={{ width: '75px' }}>Tipe</th>
                                        <th>Dari Tanggal</th>
                                        <th>Sampai Tanggal</th>
                                        <th style={{ textAlign: 'center', width: '55px' }}>Lines</th>
                                        <th style={{ textAlign: 'center', width: '70px' }}>Status</th>
                                        <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRates.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                                Belum ada data exchange rate
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRates.map((r) => {
                                            const badge = getStatusBadge(r.status);
                                            return (
                                                <tr key={r.id}
                                                    style={{
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedRate && selectedRate.id === r.id ? '#eef2ff' : undefined
                                                    }}
                                                    onClick={() => handleSelectRate(r)}>
                                                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#475569' }}>{r.id}</td>
                                                    <td>
                                                        <span className="badge" style={{
                                                            backgroundColor: '#6366f1', color: 'white',
                                                            fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px'
                                                        }}>{r.rate_type_code}</span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem' }}>{formatDate(r.from_date)}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{formatDate(r.to_date)}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-block', minWidth: '22px', padding: '1px 6px',
                                                            borderRadius: '10px', backgroundColor: '#f1f5f9',
                                                            fontSize: '0.75rem', fontWeight: 600, color: '#475569'
                                                        }}>{r.line_count || 0}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className="badge" style={{
                                                            backgroundColor: badge.color, color: 'white',
                                                            fontSize: '0.6rem', padding: '2px 6px', borderRadius: '9999px'
                                                        }}>{badge.label}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                                            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEdit(r); }} title="Edit">✏️</button>
                                                            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} title="Hapus"
                                                                style={{ color: '#ef4444' }}>🗑️</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right Panel - Detail (Lines) */}
                {selectedRate && (
                    <div className="card">
                        <div style={{
                            padding: '1rem', borderBottom: '1px solid #e2e8f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>
                                    💱 Detail Rate — XR #{selectedRate.id}
                                </h3>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem', fontSize: '0.8rem', color: '#64748b' }}>
                                    <span>Tipe: <strong>{selectedRate.rate_type_code}</strong></span>
                                    <span>Periode: <strong>{formatDate(selectedRate.from_date)} — {formatDate(selectedRate.to_date)}</strong></span>
                                </div>
                                {selectedRate.description && (
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                        {selectedRate.description}
                                    </p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                    onClick={() => { setShowLineForm(true); setEditingLine(null); resetLineForm(); }}>
                                    + Tambah Rate
                                </button>
                                <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                                    onClick={() => { setSelectedRate(null); setLines([]); }}>
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>From Currency</th>
                                        <th>To Currency</th>
                                        <th style={{ textAlign: 'right' }}>Rate</th>
                                        <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                                Belum ada rate line. Klik "+ Tambah Rate" untuk menambahkan.
                                            </td>
                                        </tr>
                                    ) : (
                                        lines.map((l) => (
                                            <tr key={l.id}>
                                                <td>
                                                    <span className="badge badge-info" style={{ marginRight: '0.4rem' }}>
                                                        {l.from_currency_code}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{l.from_currency_name}</span>
                                                </td>
                                                <td>
                                                    <span className="badge badge-info" style={{ marginRight: '0.4rem' }}>
                                                        {l.to_currency_code}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{l.to_currency_name}</span>
                                                </td>
                                                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb', fontSize: '0.95rem' }}>
                                                    {formatNumber(l.rate)}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                                        <button className="btn-icon" onClick={() => handleEditLine(l)} title="Edit">✏️</button>
                                                        <button className="btn-icon" onClick={() => handleDeleteLine(l.id)} title="Hapus"
                                                            style={{ color: '#ef4444' }}>🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        {lines.length > 0 && (
                            <div style={{
                                padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                backgroundColor: '#f8fafc', fontSize: '0.8rem', color: '#64748b'
                            }}>
                                <span>Total: <strong>{lines.length}</strong> currency pairs</span>
                                <span>XR ID: <strong>#{selectedRate.id}</strong> • Tipe: <strong>{selectedRate.rate_type_code}</strong></span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Master Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ minWidth: '550px', padding: '2rem' }}>
                        <div className="modal-header">
                            <h3>{editingRate ? 'Edit Exchange Rate' : 'Tambah Exchange Rate Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingRate(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Tipe Rate *</label>
                                <select value={formData.rate_type_id}
                                    onChange={(e) => setFormData({ ...formData, rate_type_id: e.target.value })} required>
                                    <option value="">-- Pilih Tipe Rate --</option>
                                    {rateTypes.filter(t => t.active === 'Y').map(t => (
                                        <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Dari Tanggal *</label>
                                    <input type="date" value={formData.from_date}
                                        onChange={(e) => setFormData({ ...formData, from_date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Sampai Tanggal *</label>
                                    <input type="date" value={formData.to_date}
                                        onChange={(e) => setFormData({ ...formData, to_date: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Keterangan</label>
                                <input type="text" value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Contoh: Kurs Commercial Februari 2026" />
                            </div>
                            {editingRate && (
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="A">Active</option>
                                        <option value="C">Closed</option>
                                        <option value="I">Inactive</option>
                                    </select>
                                </div>
                            )}
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingRate ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Line Form Modal */}
            {showLineForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ minWidth: '500px', padding: '2rem' }}>
                        <div className="modal-header">
                            <h3>{editingLine ? 'Edit Rate Line' : 'Tambah Rate Line'} — XR #{selectedRate.id}</h3>
                            <button className="modal-close" onClick={() => { setShowLineForm(false); setEditingLine(null); }}>×</button>
                        </div>
                        <form onSubmit={handleLineSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>From Currency *</label>
                                    <select value={lineFormData.from_currency_id}
                                        onChange={(e) => setLineFormData({ ...lineFormData, from_currency_id: e.target.value })} required>
                                        <option value="">-- Pilih --</option>
                                        {currencies.filter(c => c.active === 'Y').map(c => (
                                            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>To Currency *</label>
                                    <select value={lineFormData.to_currency_id}
                                        onChange={(e) => setLineFormData({ ...lineFormData, to_currency_id: e.target.value })} required>
                                        <option value="">-- Pilih --</option>
                                        {currencies.filter(c => c.active === 'Y').map(c => (
                                            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Rate *</label>
                                <input type="number" step="0.0001" value={lineFormData.rate}
                                    onChange={(e) => setLineFormData({ ...lineFormData, rate: e.target.value })}
                                    placeholder="Contoh: 15500.0000" required
                                    style={{ fontSize: '1.1rem', fontFamily: 'monospace' }} />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem' }}>
                                💡 Masukkan rate konversi dari From Currency ke To Currency. Contoh: 1 IDR = 15,500 USD → rate = 15500.0000
                            </p>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowLineForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingLine ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '420px', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Konfirmasi Hapus</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.6' }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button className="btn btn-outline" onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null })}>
                                Batal
                            </button>
                            <button className="btn btn-danger" onClick={confirmModal.onConfirm}
                                style={{ backgroundColor: '#ef4444', color: 'white' }}>
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExchangeRateList;
