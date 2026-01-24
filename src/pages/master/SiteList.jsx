import { useState, useEffect } from 'react';

function SiteList() {
    const [sites, setSites] = useState([]);
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSite, setEditingSite] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        entity_id: '',
        address: '',
        phone: '',
        active: 'Y'
    });

    useEffect(() => {
        fetchSites();
        fetchEntities();
    }, []);

    const fetchSites = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/sites');
            const data = await response.json();
            if (data.success) {
                setSites(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchEntities = async () => {
        try {
            const response = await fetch('/api/entities');
            const data = await response.json();
            if (data.success) {
                setEntities(data.data);
            }
        } catch (error) {
            console.error('Error fetching entities:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingSite ? `/api/sites/${editingSite.id}` : '/api/sites';
            const method = editingSite ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                setEditingSite(null);
                resetForm();
                fetchSites();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = (site) => {
        setEditingSite(site);
        setFormData({
            code: site.code,
            name: site.name,
            entity_id: site.entity_id || '',
            address: site.address || '',
            phone: site.phone || '',
            active: site.active || 'Y'
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Site ini?')) return;
        try {
            const response = await fetch(`/api/sites/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchSites();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            entity_id: '',
            address: '',
            phone: '',
            active: 'Y'
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Site</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingSite(null); resetForm(); }}>
                    + Tambah Site
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingSite ? 'Edit Site' : 'Tambah Site Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingSite(null); }}>×</button>
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
                                <label>Nama Site</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Entity</label>
                                <select
                                    value={formData.entity_id}
                                    onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                                >
                                    <option value="">-- Pilih Entity --</option>
                                    {entities.map(e => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Alamat</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Telepon</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
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
                                <button type="submit" className="btn btn-primary">{editingSite ? 'Update' : 'Simpan'}</button>
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
                                <th>Nama Site</th>
                                <th>Entity</th>
                                <th>Alamat</th>
                                <th>Telepon</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sites.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data Site
                                    </td>
                                </tr>
                            ) : (
                                sites.map((site) => (
                                    <tr key={site.id}>
                                        <td><strong>{site.code}</strong></td>
                                        <td>{site.name}</td>
                                        <td>{site.entity_name || '-'}</td>
                                        <td>{site.address}</td>
                                        <td>{site.phone}</td>
                                        <td>
                                            <span className={`badge ${site.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                                                {site.active === 'Y' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(site)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(site.id)} title="Hapus">🗑️</button>
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

export default SiteList;
