import { useState, useEffect } from 'react';

function ItemModelList() {
    const [items, setItems] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ code: '', name: '', brand_id: '', description: '', active: 'Y' });

    useEffect(() => { fetchData(); fetchBrands(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/item-models');
            const data = await res.json();
            if (data.success) setItems(data.data);
        } catch (err) { console.error('Error:', err); }
        setLoading(false);
    };

    const fetchBrands = async () => {
        try {
            const res = await fetch('/api/item-brands');
            const data = await res.json();
            if (data.success) setBrands(data.data);
        } catch (err) { console.error('Error:', err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/item-models/${editingItem.id}` : '/api/item-models';
            const method = editingItem ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (data.success) { alert(data.message); setShowForm(false); setEditingItem(null); resetForm(); fetchData(); }
            else alert('Error: ' + data.error);
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ code: item.code, name: item.name, brand_id: item.brand_id || '', description: item.description || '', active: item.active || 'Y' });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus data ini?')) return;
        try {
            const res = await fetch(`/api/item-models/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { alert(data.message); fetchData(); }
            else alert('Error: ' + data.error);
        } catch (err) { alert('Error: ' + err.message); }
    };

    const resetForm = () => setFormData({ code: '', name: '', brand_id: '', description: '', active: 'Y' });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Item Model</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingItem(null); resetForm(); }}>+ Tambah Model</button>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Item Model' : 'Tambah Item Model Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingItem(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Kode</label>
                                <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Nama Model</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Brand</label>
                                <select value={formData.brand_id} onChange={e => setFormData({ ...formData, brand_id: e.target.value })}>
                                    <option value="">-- Pilih Brand --</option>
                                    {brands.filter(b => b.active === 'Y').map(b => <option key={b.id} value={b.id}>{b.code} - {b.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Deskripsi</label>
                                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={formData.active} onChange={e => setFormData({ ...formData, active: e.target.value })}>
                                    <option value="Y">Aktif</option>
                                    <option value="N">Non-Aktif</option>
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

            <div className="card">
                {loading ? (
                    <div className="loading"><div className="loading-spinner"></div><p>Memuat data...</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Model</th>
                                <th>Brand</th>
                                <th>Deskripsi</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data</td></tr>
                            ) : items.map(item => (
                                <tr key={item.id}>
                                    <td><strong>{item.code}</strong></td>
                                    <td>{item.name}</td>
                                    <td>{item.brand_name ? <span className="badge badge-info">{item.brand_name}</span> : '-'}</td>
                                    <td>{item.description || '-'}</td>
                                    <td style={{ textAlign: 'center' }}><span className={`badge ${item.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>{item.active === 'Y' ? 'Aktif' : 'Non-Aktif'}</span></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className="btn-icon" onClick={() => handleEdit(item)} title="Edit">✏️</button>
                                        <button className="btn-icon" onClick={() => handleDelete(item.id)} title="Hapus">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default ItemModelList;
