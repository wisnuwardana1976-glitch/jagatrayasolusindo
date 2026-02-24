import { useState, useEffect } from 'react';

function FixedAssetCategoryList() {
    const [categories, setCategories] = useState([]);
    const [coaList, setCoaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        code: '', name: '', useful_life_months: 12, depreciation_method: 'StraightLine',
        depreciation_account_id: '', accumulated_account_id: '', asset_account_id: '', active: 'Y'
    });

    useEffect(() => { fetchCategories(); fetchCoa(); }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/fixed-asset-categories');
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch (err) { console.error('Error:', err); }
        setLoading(false);
    };

    const fetchCoa = async () => {
        try {
            const res = await fetch('/api/coa');
            const data = await res.json();
            if (data.success) setCoaList(data.data);
        } catch (err) { console.error('Error:', err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/fixed-asset-categories/${editingItem.id}` : '/api/fixed-asset-categories';
            const method = editingItem ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (data.success) { alert(data.message); setShowForm(false); setEditingItem(null); resetForm(); fetchCategories(); }
            else alert('Error: ' + data.error);
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            code: item.code, name: item.name, useful_life_months: item.useful_life_months,
            depreciation_method: item.depreciation_method, depreciation_account_id: item.depreciation_account_id || '',
            accumulated_account_id: item.accumulated_account_id || '', asset_account_id: item.asset_account_id || '', active: item.active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus kategori ini?')) return;
        try {
            const res = await fetch(`/api/fixed-asset-categories/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { alert(data.message); fetchCategories(); }
            else alert('Error: ' + data.error);
        } catch (err) { alert('Error: ' + err.message); }
    };

    const resetForm = () => {
        setFormData({
            code: '', name: '', useful_life_months: 12, depreciation_method: 'StraightLine',
            depreciation_account_id: '', accumulated_account_id: '', asset_account_id: '', active: 'Y'
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Kategori Aset Tetap</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingItem(null); resetForm(); }}>+ Tambah Kategori</button>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingItem(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Kode Kategori</label>
                                    <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Nama Kategori</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Umur Ekonomis (Bulan)</label>
                                    <input type="number" value={formData.useful_life_months} onChange={e => setFormData({ ...formData, useful_life_months: parseInt(e.target.value) || 0 })} required />
                                </div>
                                <div className="form-group">
                                    <label>Metode Penyusutan</label>
                                    <select value={formData.depreciation_method} onChange={e => setFormData({ ...formData, depreciation_method: e.target.value })}>
                                        <option value="StraightLine">Garis Lurus (Straight Line)</option>
                                        <option value="DecliningBalance">Saldo Menurun (Declining Balance)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Akun Aset Tetap</label>
                                <select value={formData.asset_account_id} onChange={e => setFormData({ ...formData, asset_account_id: e.target.value })}>
                                    <option value="">-- Pilih Akun --</option>
                                    {coaList.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Akun Beban Penyusutan</label>
                                <select value={formData.depreciation_account_id} onChange={e => setFormData({ ...formData, depreciation_account_id: e.target.value })}>
                                    <option value="">-- Pilih Akun --</option>
                                    {coaList.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Akun Akumulasi Penyusutan</label>
                                <select value={formData.accumulated_account_id} onChange={e => setFormData({ ...formData, accumulated_account_id: e.target.value })}>
                                    <option value="">-- Pilih Akun --</option>
                                    {coaList.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                </select>
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
                                <th>Nama Kategori</th>
                                <th style={{ textAlign: 'center' }}>Umur (Bulan)</th>
                                <th>Metode Penyusutan</th>
                                <th>Akun Aset</th>
                                <th>Akun Penyusutan</th>
                                <th>Akun Akumulasi</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length === 0 ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data kategori</td></tr>
                            ) : categories.map(cat => (
                                <tr key={cat.id}>
                                    <td><strong>{cat.code}</strong></td>
                                    <td>{cat.name}</td>
                                    <td style={{ textAlign: 'center' }}>{cat.useful_life_months}</td>
                                    <td>{cat.depreciation_method === 'StraightLine' ? 'Garis Lurus' : 'Saldo Menurun'}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{cat.asset_account_code ? `${cat.asset_account_code}` : '-'}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{cat.depreciation_account_code ? `${cat.depreciation_account_code}` : '-'}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{cat.accumulated_account_code ? `${cat.accumulated_account_code}` : '-'}</td>
                                    <td style={{ textAlign: 'center' }}><span className={`badge ${cat.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>{cat.active === 'Y' ? 'Aktif' : 'Non-Aktif'}</span></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button className="btn-icon" onClick={() => handleEdit(cat)} title="Edit">✏️</button>
                                        <button className="btn-icon" onClick={() => handleDelete(cat.id)} title="Hapus">🗑️</button>
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

export default FixedAssetCategoryList;
