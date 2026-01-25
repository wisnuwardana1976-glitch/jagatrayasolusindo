import { useState, useEffect } from 'react';

function CoaSegmentList() {
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSegment, setEditingSegment] = useState(null);
    const [formData, setFormData] = useState({
        segment_number: 1,
        segment_name: '',
        description: '',
        active: 'Y'
    });

    useEffect(() => {
        fetchSegments();
    }, []);

    const fetchSegments = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/coa-segments');
            const data = await response.json();
            if (data.success) {
                setSegments(data.data);
            }
        } catch (error) {
            console.error('Error fetching segments:', error);
        }
        setLoading(false);
    };

    const resetForm = () => {
        // Find the next available segment number
        const existingNumbers = segments.map(s => s.segment_number);
        let nextNumber = 1;
        while (existingNumbers.includes(nextNumber) && nextNumber <= 10) {
            nextNumber++;
        }

        setFormData({
            segment_number: nextNumber,
            segment_name: `Segment${nextNumber}`,
            description: '',
            active: 'Y'
        });
        setEditingSegment(null);
    };

    const handleEdit = (segment) => {
        setEditingSegment(segment);
        setFormData({
            segment_number: segment.segment_number,
            segment_name: segment.segment_name,
            description: segment.description || '',
            active: segment.active || 'Y'
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus segment ini?')) return;

        try {
            const response = await fetch(`/api/coa-segments/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchSegments();
            } else {
                alert('Gagal menghapus: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting segment:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingSegment ? `/api/coa-segments/${editingSegment.id}` : '/api/coa-segments';
            const method = editingSegment ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                setShowForm(false);
                resetForm();
                fetchSegments();
            } else {
                alert('Gagal menyimpan: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving segment:', error);
            alert('Terjadi kesalahan saat menyimpan data.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master COA Segment</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowForm(true); }}
                >
                    + Tambah Segment
                </button>
            </div>

            <div className="card">
                <p style={{ padding: '0 1rem', color: '#666', marginBottom: '1rem' }}>
                    Kelola segment untuk kode akun (COA). Setiap segment akan menjadi bagian dari format kode akun.
                </p>

                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Memuat data...</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>No</th>
                                <th>Nama Segment</th>
                                <th>Deskripsi</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {segments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data segment. Klik "Tambah Segment" untuk menambahkan.
                                    </td>
                                </tr>
                            ) : (
                                segments.map(segment => (
                                    <tr key={segment.id}>
                                        <td style={{ textAlign: 'center' }}>
                                            <strong>{segment.segment_number}</strong>
                                        </td>
                                        <td>
                                            <strong>{segment.segment_name}</strong>
                                        </td>
                                        <td>{segment.description || '-'}</td>
                                        <td>
                                            <span className={`badge ${segment.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                                                {segment.active === 'Y' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEdit(segment)}
                                                title="Edit"
                                                style={{ marginRight: '0.5rem' }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleDelete(segment.id)}
                                                title="Hapus"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}

                {/* Preview Section */}
                {segments.length > 0 && (
                    <div style={{
                        margin: '1rem',
                        padding: '1rem',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px'
                    }}>
                        <strong>Preview Format Kode Akun:</strong>
                        <div style={{
                            marginTop: '0.5rem',
                            fontFamily: 'monospace',
                            fontSize: '1.1rem',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            alignItems: 'center'
                        }}>
                            {segments
                                .filter(s => s.active === 'Y')
                                .sort((a, b) => a.segment_number - b.segment_number)
                                .map((seg, index, arr) => (
                                    <span key={seg.id} style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            backgroundColor: '#e0e0e0',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem'
                                        }}>
                                            {seg.segment_name}
                                        </span>
                                        {index < arr.length - 1 && (
                                            <span style={{ margin: '0 4px', fontWeight: 'bold' }}>.</span>
                                        )}
                                    </span>
                                ))
                            }
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                            Contoh: 01.GRP.001.0001
                        </p>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{editingSegment ? 'Edit Segment' : 'Tambah Segment Baru'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nomor Segment</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.segment_number}
                                    onChange={(e) => setFormData({ ...formData, segment_number: parseInt(e.target.value) })}
                                    required
                                />
                                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                                    Urutan segment dalam kode akun (1 = paling kiri)
                                </p>
                            </div>
                            <div className="form-group">
                                <label>Nama Segment</label>
                                <input
                                    type="text"
                                    value={formData.segment_name}
                                    onChange={(e) => setFormData({ ...formData, segment_name: e.target.value })}
                                    required
                                    placeholder="Contoh: Tipe Akun, Group, Nomor"
                                />
                            </div>
                            <div className="form-group">
                                <label>Deskripsi</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Penjelasan tentang segment ini"
                                    rows={3}
                                    style={{ width: '100%', padding: '0.5rem' }}
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
                                <button type="submit" className="btn btn-primary">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CoaSegmentList;
