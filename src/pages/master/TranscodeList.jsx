import { useState, useEffect } from 'react';

function TranscodeList() {
    const [transcodes, setTranscodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        prefix: '',
        format: '{PREFIX}/{MM}{YYYY}/{SEQ}',
        description: '',
        active: 'Y',
        nomortranscode: ''
    });
    const [transactionTypes, setTransactionTypes] = useState([]);

    useEffect(() => {
        fetchData();
        fetchTransactionTypes();
    }, []);

    const fetchTransactionTypes = async () => {
        try {
            const response = await fetch('/api/transactions');
            const data = await response.json();
            if (data.success) {
                setTransactionTypes(data.data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/transcodes');
            const data = await response.json();
            if (data.success) {
                setTranscodes(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/transcodes/${editingItem.id}` : '/api/transcodes';
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
                setEditingItem(null);
                resetForm();
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            code: item.code,
            name: item.name,
            prefix: item.prefix,
            format: item.format || '{PREFIX}-{YYYY}{MM}{DD}-{SEQ}',
            description: item.description || '',
            active: item.active || 'Y',
            nomortranscode: item.nomortranscode || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus tipe transaksi ini?')) return;
        try {
            const response = await fetch(`/api/transcodes/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const testGenerate = async (code) => {
        try {
            const response = await fetch(`/api/transcodes/${code}/generate`);
            const data = await response.json();
            if (data.success) {
                alert(`Nomor dokumen yang dihasilkan:\n${data.doc_number}`);
                fetchData(); // Refresh to show updated last_number
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            prefix: '',
            format: '{PREFIX}/{MM}{YYYY}/{SEQ}',
            description: '',
            active: 'Y',
            nomortranscode: ''
        });
    };

    const getFormatPreview = () => {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        return formData.format
            .replace('{PREFIX}', formData.prefix || 'XXX')
            .replace('{YYYY}', year)
            .replace('{YY}', year.slice(-2))
            .replace('{MM}', month)
            .replace('{DD}', day)
            .replace('{SEQ}', '0001');
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Tipe Transaksi</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingItem(null); resetForm(); }}>
                    + Tambah Tipe Transaksi
                </button>
            </div>

            {/* Info Card */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #dbeafe, #ede9fe)' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>📋 Tentang Tipe Transaksi</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563' }}>
                    Tipe Transaksi digunakan untuk mengatur format penomoran dokumen transaksi secara otomatis.
                    <br />
                    Format yang tersedia: <code>{'{PREFIX}'}</code>, <code>{'{YYYY}'}</code>, <code>{'{YY}'}</code>, <code>{'{MM}'}</code>, <code>{'{DD}'}</code>, <code>{'{SEQ}'}</code>
                </p>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Tipe Transaksi' : 'Tambah Tipe Transaksi Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingItem(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Kode Transaksi</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="PO, SO, INV"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Prefix Dokumen</label>
                                    <input
                                        type="text"
                                        value={formData.prefix}
                                        onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                                        placeholder="PO, SO, INV"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Nama Transaksi</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Purchase Order, Sales Order"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nomor Transcode</label>
                                <select
                                    value={formData.nomortranscode}
                                    onChange={(e) => setFormData({ ...formData, nomortranscode: e.target.value })}
                                >
                                    <option value="">-- Pilih Nomor Transcode --</option>
                                    {transactionTypes.map((type) => (
                                        <option key={type.id} value={type.nomortranscode}>
                                            {type.nomortranscode} - {type.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Format Nomor Dokumen</label>
                                <input
                                    type="text"
                                    value={formData.format}
                                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                                    placeholder="{PREFIX}-{YYYY}{MM}{DD}-{SEQ}"
                                />
                                <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                                    Preview: <strong>{getFormatPreview()}</strong>
                                </small>
                            </div>
                            <div className="form-group">
                                <label>Keterangan</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Deskripsi transaksi (opsional)"
                                    rows="2"
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                                >
                                    <option value="Y">Aktif</option>
                                    <option value="N">Tidak Aktif</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingItem ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card">
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Memuat data...</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No. Transcode</th>
                                <th>Kode</th>
                                <th>Nama Transaksi</th>
                                <th>Prefix</th>
                                <th>Format</th>
                                <th style={{ textAlign: 'center' }}>No. Terakhir</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transcodes.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data tipe transaksi
                                    </td>
                                </tr>
                            ) : (
                                transcodes.map((tc) => (
                                    <tr key={tc.id}>
                                        <td style={{ textAlign: 'center' }}>{tc.nomortranscode}</td>
                                        <td><span className="badge badge-info">{tc.code}</span></td>
                                        <td><strong>{tc.name}</strong></td>
                                        <td>{tc.prefix}</td>
                                        <td><code style={{ fontSize: '0.75rem' }}>{tc.format}</code></td>
                                        <td style={{ textAlign: 'center' }}>{tc.last_number}</td>
                                        <td>
                                            <span className={`badge ${tc.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                                                {tc.active === 'Y' ? 'Aktif' : 'Tidak Aktif'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => testGenerate(tc.code)} title="Test Generate">🔢</button>
                                            <button className="btn-icon" onClick={() => handleEdit(tc)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(tc.id)} title="Hapus">🗑️</button>
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

export default TranscodeList;
