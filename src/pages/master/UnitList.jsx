import { useState, useEffect } from 'react';

function UnitList() {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/units');
            const data = await response.json();
            if (data.success) {
                setUnits(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingUnit ? `/api/units/${editingUnit.id}` : '/api/units';
            const method = editingUnit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                setEditingUnit(null);
                resetForm();
                fetchUnits();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = (unit) => {
        setEditingUnit(unit);
        setFormData({
            code: unit.code,
            name: unit.name,
            description: unit.description || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus satuan ini?')) return;
        try {
            const response = await fetch(`/api/units/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchUnits();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({ code: '', name: '', description: '' });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Satuan</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingUnit(null); resetForm(); }}>
                    + Tambah Satuan
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingUnit ? 'Edit Satuan' : 'Tambah Satuan Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingUnit(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Kode Satuan</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="Contoh: PCS, BOX, KG"
                                    maxLength={20}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nama Satuan</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Pieces, Box, Kilogram"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Keterangan</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Deskripsi satuan (opsional)"
                                    rows="2"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingUnit ? 'Update' : 'Simpan'}</button>
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
                                <th>Nama Satuan</th>
                                <th>Keterangan</th>
                                <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data satuan
                                    </td>
                                </tr>
                            ) : (
                                units.map((unit) => (
                                    <tr key={unit.id}>
                                        <td><span className="badge badge-info">{unit.code}</span></td>
                                        <td><strong>{unit.name}</strong></td>
                                        <td style={{ color: '#6b7280' }}>{unit.description || '-'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(unit)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(unit.id)} title="Hapus">🗑️</button>
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

export default UnitList;
