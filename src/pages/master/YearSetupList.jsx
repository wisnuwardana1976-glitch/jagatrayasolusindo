import { useState, useEffect } from 'react';

function YearSetupList() {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        yearid: new Date().getFullYear()
    });

    useEffect(() => {
        fetchYears();
    }, []);

    const fetchYears = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/year-setup');
            const data = await response.json();
            if (data.success) {
                setYears(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/year-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                resetForm();
                fetchYears();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Tahun ini?')) return;
        try {
            const response = await fetch(`/api/year-setup/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchYears();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({ yearid: new Date().getFullYear() });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Year Setup</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); resetForm(); }}>
                    + Tambah Tahun
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Tambah Tahun</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Tahun</label>
                                <input
                                    type="number"
                                    value={formData.yearid}
                                    onChange={(e) => setFormData({ ...formData, yearid: parseInt(e.target.value) || 0 })}
                                    placeholder="Contoh: 2025"
                                    min="1900"
                                    max="2100"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">Simpan</button>
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
                                <th style={{ textAlign: 'center' }}>Tahun</th>
                                <th style={{ textAlign: 'center', width: '80px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {years.length === 0 ? (
                                <tr>
                                    <td colSpan="2" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data Tahun
                                    </td>
                                </tr>
                            ) : (
                                years.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{ textAlign: 'center' }}><strong>{item.yearid}</strong></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleDelete(item.id)} title="Hapus">🗑️</button>
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

export default YearSetupList;
