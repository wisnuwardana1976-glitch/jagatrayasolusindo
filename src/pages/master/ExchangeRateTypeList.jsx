import { useState, useEffect } from 'react';

function ExchangeRateTypeList() {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        code: '', name: '', description: '', active: 'Y'
    });

    useEffect(() => { fetchTypes(); }, []);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/exchange-rate-types');
            const data = await response.json();
            if (data.success) setTypes(data.data);
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingType ? `/api/exchange-rate-types/${editingType.id}` : '/api/exchange-rate-types';
            const method = editingType ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                setEditingType(null);
                resetForm();
                fetchTypes();
            } else { alert('Error: ' + data.error); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const handleEdit = (type) => {
        setEditingType(type);
        setFormData({
            code: type.code, name: type.name,
            description: type.description || '', active: type.active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Exchange Rate Type ini?')) return;
        try {
            const response = await fetch(`/api/exchange-rate-types/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchTypes();
            } else { alert('Error: ' + data.error); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const resetForm = () => {
        setFormData({ code: '', name: '', description: '', active: 'Y' });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Exchange Rate Type</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingType(null); resetForm(); }}>
                    + Tambah Rate Type
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ minWidth: '500px', padding: '2rem' }}>
                        <div className="modal-header">
                            <h3>{editingType ? 'Edit Rate Type' : 'Tambah Rate Type Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingType(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Kode</label>
                                    <input type="text" value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="Contoh: COM, TAX, REVAL" maxLength={20} required />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.value })}>
                                        <option value="Y">Aktif</option>
                                        <option value="N">Nonaktif</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Nama</label>
                                <input type="text" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Commercial, Tax / Pajak" required />
                            </div>
                            <div className="form-group">
                                <label>Keterangan</label>
                                <textarea value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Deskripsi rate type (opsional)" rows="2" />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingType ? 'Update' : 'Simpan'}</button>
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
                                <th style={{ width: '100px' }}>Kode</th>
                                <th>Nama</th>
                                <th>Keterangan</th>
                                <th style={{ textAlign: 'center', width: '80px' }}>Status</th>
                                <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {types.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data exchange rate type
                                    </td>
                                </tr>
                            ) : (
                                types.map((t) => (
                                    <tr key={t.id}>
                                        <td><span className="badge badge-info">{t.code}</span></td>
                                        <td><strong>{t.name}</strong></td>
                                        <td style={{ color: '#6b7280' }}>{t.description || '-'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="badge" style={{
                                                backgroundColor: t.active === 'Y' ? '#10b981' : '#ef4444',
                                                color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '9999px'
                                            }}>{t.active === 'Y' ? 'Aktif' : 'Nonaktif'}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(t)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(t.id)} title="Hapus">🗑️</button>
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

export default ExchangeRateTypeList;
