import { useState, useEffect } from 'react';

function FixedAssetList() {
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showDispose, setShowDispose] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchText, setSearchText] = useState('');
    const [formData, setFormData] = useState({
        name: '', description: '', category_id: '', acquisition_date: '', acquisition_cost: 0,
        salvage_value: 0, useful_life_months: '', depreciation_method: '', location: '', serial_number: '', notes: ''
    });
    const [disposeData, setDisposeData] = useState({ disposal_date: '', disposal_value: 0, status: 'Disposed' });

    useEffect(() => { fetchAssets(); fetchCategories(); }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            let url = '/api/fixed-assets?';
            if (filterCategory) url += `category_id=${filterCategory}&`;
            if (filterStatus) url += `status=${filterStatus}&`;
            if (searchText) url += `search=${encodeURIComponent(searchText)}&`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) setAssets(data.data);
        } catch (err) { console.error('Error:', err); }
        setLoading(false);
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/fixed-asset-categories');
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch (err) { console.error('Error:', err); }
    };

    useEffect(() => { fetchAssets(); }, [filterCategory, filterStatus]);

    const handleSearch = () => fetchAssets();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/fixed-assets/${editingItem.id}` : '/api/fixed-assets';
            const method = editingItem ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (data.success) { alert(data.message); setShowForm(false); setEditingItem(null); resetForm(); fetchAssets(); }
            else alert('Error: ' + data.error);
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name, description: item.description || '', category_id: item.category_id,
            acquisition_date: item.acquisition_date ? item.acquisition_date.substring(0, 10) : '',
            acquisition_cost: item.acquisition_cost, salvage_value: item.salvage_value,
            useful_life_months: item.useful_life_months, depreciation_method: item.depreciation_method,
            location: item.location || '', serial_number: item.serial_number || '', notes: item.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus aset ini?')) return;
        try {
            const res = await fetch(`/api/fixed-assets/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { alert(data.message); fetchAssets(); }
            else alert('Error: ' + data.error);
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleViewDetail = async (id) => {
        try {
            const res = await fetch(`/api/fixed-assets/${id}`);
            const data = await res.json();
            if (data.success) { setDetailData(data.data); setShowDetail(true); }
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleDispose = (asset) => {
        setEditingItem(asset);
        setDisposeData({ disposal_date: new Date().toISOString().substring(0, 10), disposal_value: 0, status: 'Disposed' });
        setShowDispose(true);
    };

    const submitDispose = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/fixed-assets/${editingItem.id}/dispose`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(disposeData)
            });
            const data = await res.json();
            if (data.success) { alert(data.message); setShowDispose(false); fetchAssets(); }
            else alert('Error: ' + data.error);
        } catch (err) { alert('Error: ' + err.message); }
    };

    const resetForm = () => {
        setFormData({
            name: '', description: '', category_id: '', acquisition_date: '', acquisition_cost: 0,
            salvage_value: 0, useful_life_months: '', depreciation_method: '', location: '', serial_number: '', notes: ''
        });
    };

    const handleCategoryChange = (catId) => {
        setFormData(prev => ({ ...prev, category_id: catId }));
        const cat = categories.find(c => c.id === parseInt(catId));
        if (cat && !editingItem) {
            setFormData(prev => ({ ...prev, category_id: catId, useful_life_months: cat.useful_life_months, depreciation_method: cat.depreciation_method }));
        }
    };

    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID') : '-';

    const statusBadge = (status) => {
        const map = { Active: 'badge-success', Disposed: 'badge-danger', Sold: 'badge-warning', 'Fully Depreciated': 'badge-info' };
        return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
    };

    // Summary calculations
    const totalAssets = assets.length;
    const totalCost = assets.reduce((s, a) => s + parseFloat(a.acquisition_cost || 0), 0);
    const totalAccum = assets.reduce((s, a) => s + parseFloat(a.accumulated_depreciation || 0), 0);
    const totalBV = assets.reduce((s, a) => s + parseFloat(a.book_value || 0), 0);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Daftar Aset Tetap</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingItem(null); resetForm(); }}>+ Tambah Aset</button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Total Aset</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#63b3ed' }}>{totalAssets}</div>
                </div>
                <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Nilai Perolehan</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#68d391' }}>{formatCurrency(totalCost)}</div>
                </div>
                <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Akumulasi Penyusutan</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fc8181' }}>{formatCurrency(totalAccum)}</div>
                </div>
                <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Nilai Buku</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f6ad55' }}>{formatCurrency(totalBV)}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Kategori</label>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ minWidth: '150px' }}>
                        <option value="">Semua</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: '130px' }}>
                        <option value="">Semua</option>
                        <option value="Active">Active</option>
                        <option value="Disposed">Disposed</option>
                        <option value="Sold">Sold</option>
                        <option value="Fully Depreciated">Fully Depreciated</option>
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Cari</label>
                    <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="No. Aset / Nama / SN..."
                        onKeyDown={e => e.key === 'Enter' && handleSearch()} style={{ minWidth: '200px' }} />
                </div>
                <button className="btn btn-primary" onClick={handleSearch} style={{ marginBottom: '0.5rem' }}>🔍 Cari</button>
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Aset Tetap' : 'Tambah Aset Tetap Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingItem(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nama Aset *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Deskripsi</label>
                                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Kategori *</label>
                                    <select value={formData.category_id} onChange={e => handleCategoryChange(e.target.value)} required>
                                        <option value="">-- Pilih Kategori --</option>
                                        {categories.filter(c => c.active === 'Y').map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tanggal Perolehan *</label>
                                    <input type="date" value={formData.acquisition_date} onChange={e => setFormData({ ...formData, acquisition_date: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Harga Perolehan *</label>
                                    <input type="number" value={formData.acquisition_cost} onChange={e => setFormData({ ...formData, acquisition_cost: parseFloat(e.target.value) || 0 })} required />
                                </div>
                                <div className="form-group">
                                    <label>Nilai Sisa (Salvage)</label>
                                    <input type="number" value={formData.salvage_value} onChange={e => setFormData({ ...formData, salvage_value: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Umur Ekonomis (Bulan)</label>
                                    <input type="number" value={formData.useful_life_months} onChange={e => setFormData({ ...formData, useful_life_months: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group">
                                    <label>Metode Penyusutan</label>
                                    <select value={formData.depreciation_method} onChange={e => setFormData({ ...formData, depreciation_method: e.target.value })}>
                                        <option value="">Dari Kategori</option>
                                        <option value="StraightLine">Garis Lurus</option>
                                        <option value="DecliningBalance">Saldo Menurun</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Lokasi</label>
                                    <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Nomor Seri</label>
                                    <input type="text" value={formData.serial_number} onChange={e => setFormData({ ...formData, serial_number: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Catatan</label>
                                <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingItem ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dispose Modal */}
            {showDispose && editingItem && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Dispose Aset: {editingItem.asset_no}</h3>
                            <button className="modal-close" onClick={() => setShowDispose(false)}>×</button>
                        </div>
                        <form onSubmit={submitDispose}>
                            <div className="form-group">
                                <label>Status Disposal</label>
                                <select value={disposeData.status} onChange={e => setDisposeData({ ...disposeData, status: e.target.value })}>
                                    <option value="Disposed">Disposed (Dibuang)</option>
                                    <option value="Sold">Sold (Dijual)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tanggal Disposal</label>
                                <input type="date" value={disposeData.disposal_date} onChange={e => setDisposeData({ ...disposeData, disposal_date: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Nilai Disposal</label>
                                <input type="number" value={disposeData.disposal_value} onChange={e => setDisposeData({ ...disposeData, disposal_value: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowDispose(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">Proses Dispose</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetail && detailData && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h3>Detail Aset: {detailData.asset_no}</h3>
                            <button className="modal-close" onClick={() => setShowDetail(false)}>×</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div><strong>Nama:</strong> {detailData.name}</div>
                            <div><strong>Kategori:</strong> {detailData.category_name}</div>
                            <div><strong>Tgl Perolehan:</strong> {formatDate(detailData.acquisition_date)}</div>
                            <div><strong>Harga Perolehan:</strong> {formatCurrency(detailData.acquisition_cost)}</div>
                            <div><strong>Nilai Sisa:</strong> {formatCurrency(detailData.salvage_value)}</div>
                            <div><strong>Akumulasi:</strong> {formatCurrency(detailData.accumulated_depreciation)}</div>
                            <div><strong>Nilai Buku:</strong> {formatCurrency(detailData.book_value)}</div>
                            <div><strong>Status:</strong> {statusBadge(detailData.status)}</div>
                            <div><strong>Umur Ekonomis:</strong> {detailData.useful_life_months} bulan</div>
                            <div><strong>Metode:</strong> {detailData.depreciation_method === 'StraightLine' ? 'Garis Lurus' : 'Saldo Menurun'}</div>
                            <div><strong>Lokasi:</strong> {detailData.location || '-'}</div>
                            <div><strong>Nomor Seri:</strong> {detailData.serial_number || '-'}</div>
                        </div>
                        <h4 style={{ marginBottom: '0.5rem' }}>Riwayat Penyusutan</h4>
                        {detailData.depreciations && detailData.depreciations.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Periode</th>
                                        <th style={{ textAlign: 'right' }}>Penyusutan</th>
                                        <th style={{ textAlign: 'right' }}>Akumulasi</th>
                                        <th style={{ textAlign: 'right' }}>Nilai Buku</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailData.depreciations.map(d => (
                                        <tr key={d.id}>
                                            <td>{formatDate(d.period_date)}</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(d.depreciation_amount)}</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(d.accumulated_amount)}</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(d.book_value)}</td>
                                            <td style={{ textAlign: 'center' }}><span className="badge badge-success">{d.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ color: '#a0aec0', textAlign: 'center', padding: '1rem' }}>Belum ada riwayat penyusutan</p>
                        )}
                    </div>
                </div>
            )}

            {/* Asset Table */}
            <div className="card">
                {loading ? (
                    <div className="loading"><div className="loading-spinner"></div><p>Memuat data...</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No. Aset</th>
                                <th>Nama Aset</th>
                                <th>Kategori</th>
                                <th>Tgl Perolehan</th>
                                <th style={{ textAlign: 'right' }}>Harga Perolehan</th>
                                <th style={{ textAlign: 'right' }}>Akumulasi</th>
                                <th style={{ textAlign: 'right' }}>Nilai Buku</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.length === 0 ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data aset tetap</td></tr>
                            ) : assets.map(a => (
                                <tr key={a.id}>
                                    <td><strong style={{ cursor: 'pointer', color: '#63b3ed' }} onClick={() => handleViewDetail(a.id)}>{a.asset_no}</strong></td>
                                    <td>{a.name}</td>
                                    <td><span className="badge badge-info">{a.category_name || '-'}</span></td>
                                    <td>{formatDate(a.acquisition_date)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(a.acquisition_cost)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(a.accumulated_depreciation)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(a.book_value)}</td>
                                    <td style={{ textAlign: 'center' }}>{statusBadge(a.status)}</td>
                                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        <button className="btn-icon" onClick={() => handleViewDetail(a.id)} title="Detail">📋</button>
                                        <button className="btn-icon" onClick={() => handleEdit(a)} title="Edit">✏️</button>
                                        {a.status === 'Active' && <button className="btn-icon" onClick={() => handleDispose(a)} title="Dispose">🚫</button>}
                                        <button className="btn-icon" onClick={() => handleDelete(a.id)} title="Hapus">🗑️</button>
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

export default FixedAssetList;
