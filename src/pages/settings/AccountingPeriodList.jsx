import { useState, useEffect } from 'react';

const AccountingPeriodList = () => {
    const [periods, setPeriods] = useState([]);
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        start_date: '',
        end_date: '',
        status: 'Open',
        active: 'Y',
        is_starting: 'N',
        yearid: '',
        monthid: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchPeriods();
        fetchYears();
    }, []);

    const fetchYears = async () => {
        try {
            const response = await fetch('/api/year-setup');
            const data = await response.json();
            if (data.success) {
                setYears(data.data);
            }
        } catch (error) {
            console.error('Error fetching years:', error);
        }
    };

    const fetchPeriods = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/accounting-periods');
            const data = await response.json();
            if (data.success) {
                setPeriods(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = isEditing
                ? `/api/accounting-periods/${editId}`
                : '/api/accounting-periods';

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                setShowModal(false);
                fetchPeriods();
                resetForm();
            } else {
                alert(data.error || 'Terjadi kesalahan');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan koneksi');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus periode ini?')) {
            try {
                const response = await fetch(`/api/accounting-periods/${id}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                if (data.success) {
                    fetchPeriods();
                } else {
                    alert(data.error);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    const handleEdit = (period) => {
        // Format date for input[type=date]
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toISOString().split('T')[0];
        };

        setFormData({
            code: period.code,
            name: period.name,
            start_date: formatDate(period.start_date),
            end_date: formatDate(period.end_date),
            status: period.status,
            active: period.active,
            is_starting: period.is_starting || 'N',
            yearid: period.yearid || '',
            monthid: period.monthid || ''
        });
        setIsEditing(true);
        setEditId(period.id);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            start_date: '',
            end_date: '',
            status: 'Open',
            active: 'Y',
            is_starting: 'N',
            yearid: '',
            monthid: ''
        });
        setIsEditing(false);
        setEditId(null);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Periode Akuntansi</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    + Tambah Periode
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>Memuat data...</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama</th>
                                <th>Mulai</th>
                                <th>Selesai</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Starting</th>
                                <th style={{ textAlign: 'center' }}>Aktif</th>
                                <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periods.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data periode akuntansi
                                    </td>
                                </tr>
                            ) : (
                                periods.map((period) => (
                                    <tr key={period.id}>
                                        <td><span className="badge badge-info">{period.code}</span></td>
                                        <td><strong>{period.name}</strong></td>
                                        <td>{new Date(period.start_date).toLocaleDateString()}</td>
                                        <td>{new Date(period.end_date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${period.status === 'Open' ? 'badge-success' :
                                                period.status === 'Closed' ? 'badge-secondary' : 'badge-danger'
                                                }`}>
                                                {period.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {period.is_starting === 'Y'
                                                ? <span className="badge badge-warning">⭐ Starting</span>
                                                : '-'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={period.active === 'Y' ? 'text-success' : 'text-danger'}>
                                                {period.active === 'Y' ? '✓' : '✗'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleEdit(period)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleDelete(period.id)}
                                                    title="Hapus"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{isEditing ? 'Edit Periode' : 'Tambah Periode Baru'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ padding: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Kode</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        required
                                        placeholder="Contoh: 2026-01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nama Periode</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Contoh: Januari 2026"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Tahun</label>
                                        <select
                                            value={formData.yearid}
                                            onChange={(e) => setFormData({ ...formData, yearid: parseInt(e.target.value) || '' })}
                                            required
                                        >
                                            <option value="">-- Pilih Tahun --</option>
                                            {years.map((y) => (
                                                <option key={y.id} value={y.yearid}>{y.yearid}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Bulan</label>
                                        <select
                                            value={formData.monthid}
                                            onChange={(e) => setFormData({ ...formData, monthid: parseInt(e.target.value) || '' })}
                                            required
                                        >
                                            <option value="">-- Pilih Bulan --</option>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Tanggal Mulai</label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Tanggal Selesai</label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="Open">Open</option>
                                            <option value="Closed">Closed</option>
                                            <option value="Locked">Locked</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Aktif</label>
                                        <select
                                            value={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                                        >
                                            <option value="Y">Ya</option>
                                            <option value="N">Tidak</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_starting === 'Y'}
                                            onChange={(e) => setFormData({ ...formData, is_starting: e.target.checked ? 'Y' : 'N' })}
                                            style={{ width: 'auto', marginRight: '0.5rem' }}
                                        />
                                        <span>⭐ Starting Period (Periode Awal)</span>
                                    </label>
                                    <small style={{ color: '#666', fontSize: '0.85rem' }}>Tandai jika ini adalah periode awal untuk input saldo awal</small>
                                </div>
                            </div>
                            <div className="form-actions" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountingPeriodList;
