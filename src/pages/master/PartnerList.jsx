import { useState, useEffect } from 'react';

function PartnerList({ type }) {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: type,
        address: '',
        phone: ''
    });

    useEffect(() => {
        fetchPartners();
    }, [type]);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/partners?type=${type}`);
            const data = await response.json();
            if (data.success) {
                setPartners(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingPartner ? `/api/partners/${editingPartner.id}` : '/api/partners';
            const method = editingPartner ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, type })
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                setEditingPartner(null);
                resetForm();
                fetchPartners();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = (partner) => {
        setEditingPartner(partner);
        setFormData({
            code: partner.code,
            name: partner.name,
            type: partner.type,
            address: partner.address || '',
            phone: partner.phone || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm(`Yakin ingin menghapus ${type} ini?`)) return;
        try {
            const response = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchPartners();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({ code: '', name: '', type: type, address: '', phone: '' });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master {type}</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingPartner(null); resetForm(); }}>
                    + Tambah {type}
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingPartner ? `Edit ${type}` : `Tambah ${type} Baru`}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingPartner(null); }}>×</button>
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
                                <label>Nama {type}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
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
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingPartner ? 'Update' : 'Simpan'}</button>
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
                                <th>Nama</th>
                                <th>Alamat</th>
                                <th>Telepon</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partners.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data {type}
                                    </td>
                                </tr>
                            ) : (
                                partners.map((partner) => (
                                    <tr key={partner.id}>
                                        <td><strong>{partner.code}</strong></td>
                                        <td>{partner.name}</td>
                                        <td>{partner.address}</td>
                                        <td>{partner.phone}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(partner)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(partner.id)} title="Hapus">🗑️</button>
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

export default PartnerList;
