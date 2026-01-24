import { useState, useEffect } from 'react';

function LocationList() {
    const [locations, setLocations] = useState([]);
    const [subWarehouses, setSubWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        sub_warehouse_id: '',
        active: 'Y'
    });

    useEffect(() => {
        fetchLocations();
        fetchSubWarehouses();
    }, []);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/locations');
            const data = await response.json();
            if (data.success) {
                setLocations(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchSubWarehouses = async () => {
        try {
            const response = await fetch('/api/sub-warehouses');
            const data = await response.json();
            if (data.success) {
                setSubWarehouses(data.data);
            }
        } catch (error) {
            console.error('Error fetching sub warehouses:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations';
            const method = editingLocation ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                setEditingLocation(null);
                resetForm();
                fetchLocations();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = (loc) => {
        setEditingLocation(loc);
        setFormData({
            code: loc.code,
            name: loc.name,
            sub_warehouse_id: loc.sub_warehouse_id || '',
            active: loc.active || 'Y'
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Location ini?')) return;
        try {
            const response = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchLocations();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            sub_warehouse_id: '',
            active: 'Y'
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Location</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingLocation(null); resetForm(); }}>
                    + Tambah Location
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingLocation ? 'Edit Location' : 'Tambah Location Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingLocation(null); }}>×</button>
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
                                <label>Nama Location</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Sub Warehouse</label>
                                <select
                                    value={formData.sub_warehouse_id}
                                    onChange={(e) => setFormData({ ...formData, sub_warehouse_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- Pilih Sub Warehouse --</option>
                                    {subWarehouses.map(sw => (
                                        <option key={sw.id} value={sw.id}>{sw.name}</option>
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
                                <button type="submit" className="btn btn-primary">{editingLocation ? 'Update' : 'Simpan'}</button>
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
                                <th>Nama Location</th>
                                <th>Sub Warehouse</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data Location
                                    </td>
                                </tr>
                            ) : (
                                locations.map((loc) => (
                                    <tr key={loc.id}>
                                        <td><strong>{loc.code}</strong></td>
                                        <td>{loc.name}</td>
                                        <td>{loc.sub_warehouse_name || '-'}</td>
                                        <td>
                                            <span className={`badge ${loc.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                                                {loc.active === 'Y' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(loc)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(loc.id)} title="Hapus">🗑️</button>
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

export default LocationList;
