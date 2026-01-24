import { useState, useEffect } from 'react';

function WarehouseList() {
    const [warehouses, setWarehouses] = useState([]);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        site_id: '',
        active: 'Y'
    });

    useEffect(() => {
        fetchWarehouses();
        fetchSites();
    }, []);

    const fetchWarehouses = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/warehouses');
            const data = await response.json();
            if (data.success) {
                setWarehouses(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchSites = async () => {
        try {
            const response = await fetch('/api/sites');
            const data = await response.json();
            if (data.success) {
                setSites(data.data);
            }
        } catch (error) {
            console.error('Error fetching sites:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingWarehouse ? `/api/warehouses/${editingWarehouse.id}` : '/api/warehouses';
            const method = editingWarehouse ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                setEditingWarehouse(null);
                resetForm();
                fetchWarehouses();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = (warehouse) => {
        setEditingWarehouse(warehouse);
        setFormData({
            code: warehouse.code,
            description: warehouse.description,
            site_id: warehouse.site_id || '',
            active: warehouse.active || 'Y'
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Warehouse ini?')) return;
        try {
            const response = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchWarehouses();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            site_id: '',
            active: 'Y'
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Warehouse</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingWarehouse(null); resetForm(); }}>
                    + Tambah Warehouse
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingWarehouse ? 'Edit Warehouse' : 'Tambah Warehouse Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingWarehouse(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Kode</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Site</label>
                                <select
                                    value={formData.site_id}
                                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- Pilih Site --</option>
                                    {sites.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                                >
                                    <option value="Y">Active</option>
                                    <option value="N">Inactive</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingWarehouse ? 'Update' : 'Simpan'}</button>
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
                                <th>Kode</th>
                                <th>Description</th>
                                <th>Site</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {warehouses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data Warehouse
                                    </td>
                                </tr>
                            ) : (
                                warehouses.map((warehouse) => (
                                    <tr key={warehouse.id}>
                                        <td><strong>{warehouse.code}</strong></td>
                                        <td>{warehouse.description}</td>
                                        <td>{warehouse.site_name || '-'}</td>
                                        <td>
                                            <span className={`badge ${warehouse.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                                                {warehouse.active === 'Y' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(warehouse)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(warehouse.id)} title="Hapus">🗑️</button>
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

export default WarehouseList;
