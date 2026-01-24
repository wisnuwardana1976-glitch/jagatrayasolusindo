import { useState, useEffect } from 'react';

function SalesPersonList() {
    const [salesPersons, setSalesPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/salespersons');
            const data = await response.json();
            if (data.success) {
                setSalesPersons(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/salespersons/${editingItem.id}` : '/api/salespersons';
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
            phone: item.phone || '',
            email: item.email || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Sales Person ini?')) return;
        try {
            const response = await fetch(`/api/salespersons/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({ code: '', name: '', phone: '', email: '' });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Sales Person</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingItem(null); resetForm(); }}>
                    + Tambah Sales Person
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Sales Person' : 'Tambah Sales Person Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingItem(null); }}>×</button>
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
                                <label>Nama</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
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
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
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
                                <th>Kode</th>
                                <th>Nama</th>
                                <th>Telepon</th>
                                <th>Email</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesPersons.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data Sales Person
                                    </td>
                                </tr>
                            ) : (
                                salesPersons.map((sp) => (
                                    <tr key={sp.id}>
                                        <td><strong>{sp.code}</strong></td>
                                        <td>{sp.name}</td>
                                        <td>{sp.phone}</td>
                                        <td>{sp.email}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(sp)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(sp.id)} title="Hapus">🗑️</button>
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

export default SalesPersonList;
