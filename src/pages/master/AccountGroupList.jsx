import { useState, useEffect } from 'react';

function AccountGroupList() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        active: 'Y'
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/account-groups');
            const data = await response.json();
            if (data.success) {
                setGroups(data.data);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
        setLoading(false);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredGroups = groups.filter(group =>
        group.code.toString().includes(searchTerm) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            active: 'Y'
        });
        setEditingGroup(null);
    };

    const handleEdit = (group) => {
        setEditingGroup(group);
        setFormData({
            code: group.code,
            description: group.description,
            active: group.active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus Group Akun ini?')) return;

        try {
            const response = await fetch(`/api/account-groups/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchGroups();
            } else {
                alert('Gagal menghapus: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting group:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingGroup ? `/api/account-groups/${editingGroup.id}` : '/api/account-groups';
            const method = editingGroup ? 'PUT' : 'POST';

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
                fetchGroups();
            } else {
                alert('Gagal menyimpan: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving group:', error);
            alert('Terjadi kesalahan saat menyimpan data.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Group COA</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowForm(true); }}
                >
                    + Tambah Group
                </button>
            </div>

            <div className="card">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Cari kode atau deskripsi..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="search-input"
                    />
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Memuat data...</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Kode Group</th>
                                <th>Deskripsi</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGroups.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>
                                        Tidak ada data yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredGroups.map(group => (
                                    <tr key={group.id}>
                                        <td><strong>{group.code}</strong></td>
                                        <td>{group.description}</td>
                                        <td>
                                            <span className={`badge ${group.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                                                {group.active === 'Y' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEdit(group)}
                                                title="Edit"
                                                style={{ marginRight: '0.5rem' }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleDelete(group.id)}
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
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingGroup ? 'Edit Group Akun' : 'Tambah Group Akun Baru'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Kode Group (Angka)</label>
                                <input
                                    type="number"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: parseInt(e.target.value) || '' })}
                                    required
                                    placeholder="Contoh: 1"
                                />
                            </div>
                            <div className="form-group">
                                <label>Deskripsi</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    placeholder="Contoh: ASET LANCAR"
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

export default AccountGroupList;
