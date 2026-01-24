import { useState, useEffect } from 'react';

function SubWarehouseList() {
    const [subWarehouses, setSubWarehouses] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSubWarehouse, setEditingSubWarehouse] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        warehouse_id: '',
        active: 'Y'
    });

    useEffect(() => {
        fetchSubWarehouses();
        fetchWarehouses();
    }, []);

    const fetchSubWarehouses = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/sub-warehouses');
            const data = await response.json();
            if (data.success) {
                setSubWarehouses(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchWarehouses = async () => {
        try {
            const response = await fetch('/api/warehouses');
            const data = await response.json();
            if (data.success) {
                setWarehouses(data.data);
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingSubWarehouse ? `/api/sub-warehouses/${editingSubWarehouse.id}` : '/api/sub-warehouses';
            const method = editingSubWarehouse ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                setEditingSubWarehouse(null);
                resetForm();
                fetchSubWarehouses();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = (sw) => {
        setEditingSubWarehouse(sw);
        setFormData({
            code: sw.code,
            name: sw.name,
            warehouse_id: sw.warehouse_id || '',
            active: sw.active || 'Y'
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Sub Warehouse ini?')) return;
        try {
            const response = await fetch(`/api/sub-warehouses/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchSubWarehouses();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            warehouse_id: '',
            active: 'Y'
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Sub Warehouse</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingSubWarehouse(null); resetForm(); }}>
                    + Tambah Sub Warehouse
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingSubWarehouse ? 'Edit Sub Warehouse' : 'Tambah Sub Warehouse Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingSubWarehouse(null); }}>×</button>
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
                                <label>Nama Sub Warehouse</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Warehouse</label>
                                <select
                                    value={formData.warehouse_id}
                                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- Pilih Warehouse --</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
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
                                <button type="submit" className="btn btn-primary">{editingSubWarehouse ? 'Update' : 'Simpan'}</button>
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
                                <th>Nama Sub Warehouse</th>
                                <th>Warehouse</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subWarehouses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data Sub Warehouse
                                    </td>
                                </tr>
                            ) : (
                                subWarehouses.map((sw) => (
                                    <tr key={sw.id}>
                                        <td><strong>{sw.code}</strong></td>
                                        <td>{sw.name}</td>
                                        <td>{sw.warehouse_name || '-'}</td>
                                        <td>
                                            <span className={`badge ${sw.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                                                {sw.active === 'Y' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(sw)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(sw.id)} title="Hapus">🗑️</button>
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

export default SubWarehouseList;
