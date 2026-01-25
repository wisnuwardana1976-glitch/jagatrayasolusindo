import { useState, useEffect } from 'react';

function PaymentTermList() {
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTerm, setEditingTerm] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        days: 0,
        description: '',
        active: 'Y'
    });

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/payment-terms');
            const data = await response.json();
            if (data.success) {
                setTerms(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingTerm ? `/api/payment-terms/${editingTerm.id}` : '/api/payment-terms';
            const method = editingTerm ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                setEditingTerm(null);
                resetForm();
                fetchTerms();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = (term) => {
        setEditingTerm(term);
        setFormData({
            code: term.code,
            name: term.name,
            days: term.days,
            description: term.description || '',
            active: term.active || 'Y'
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Term of Payment ini?')) return;
        try {
            const response = await fetch(`/api/payment-terms/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchTerms();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({ code: '', name: '', days: 0, description: '', active: 'Y' });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Term of Payment</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingTerm(null); resetForm(); }}>
                    + Tambah TOP
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingTerm ? 'Edit Term of Payment' : 'Tambah Term of Payment'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingTerm(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Kode</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="Contoh: COD, NET30"
                                    maxLength={20}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nama</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Cash on Delivery"
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Jumlah Hari</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.days}
                                        onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 0 })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                                    >
                                        <option value="Y">Aktif</option>
                                        <option value="N">Non-Aktif</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Keterangan</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Deskripsi (opsional)"
                                    rows="2"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingTerm ? 'Update' : 'Simpan'}</button>
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
                                <th style={{ width: '100px', textAlign: 'center' }}>Hari</th>
                                <th>Keterangan</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {terms.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data Term of Payment
                                    </td>
                                </tr>
                            ) : (
                                terms.map((term) => (
                                    <tr key={term.id}>
                                        <td><span className="badge badge-info">{term.code}</span></td>
                                        <td><strong>{term.name}</strong></td>
                                        <td style={{ textAlign: 'center' }}>{term.days} hari</td>
                                        <td style={{ color: '#6b7280' }}>{term.description || '-'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge ${term.active === 'Y' ? 'badge-success' : 'badge-warning'}`}>
                                                {term.active === 'Y' ? 'Aktif' : 'Non-Aktif'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(term)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(term.id)} title="Hapus">🗑️</button>
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

export default PaymentTermList;
