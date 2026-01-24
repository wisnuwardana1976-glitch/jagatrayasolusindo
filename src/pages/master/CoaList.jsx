import { useState, useEffect } from 'react';

function CoaList() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'ASSET',
        level: 1,
        parent_id: '',
        active: 'Y'
    });

    const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/accounts');
            const data = await response.json();
            if (data.success) {
                setAccounts(data.data);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
        setLoading(false);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredAccounts = accounts.filter(acc =>
        acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            type: 'ASSET',
            level: 1,
            parent_id: '',
            active: 'Y'
        });
        setEditingAccount(null);
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            code: account.code,
            name: account.name,
            type: account.type,
            level: account.level,
            parent_id: account.parent_id || '',
            active: account.active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus akun ini?')) return;

        try {
            const response = await fetch(`/api/accounts/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchAccounts();
            } else {
                alert('Gagal menghapus: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts';
            const method = editingAccount ? 'PUT' : 'POST';

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
                fetchAccounts();
            } else {
                alert('Gagal menyimpan: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving account:', error);
            alert('Terjadi kesalahan saat menyimpan data.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Chart of Accounts</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowForm(true); }}
                >
                    + Tambah Akun
                </button>
            </div>

            <div className="card">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Cari akun..."
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
                                <th>Kode</th>
                                <th>Nama Akun</th>
                                <th>Tipe</th>
                                <th>Level</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>
                                        Tidak ada data yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map(account => (
                                    <tr key={account.id}>
                                        <td>{account.code}</td>
                                        <td style={{ paddingLeft: `${(account.level - 1) * 1.5}rem` }}>
                                            {account.level > 1 && '└─ '}
                                            <strong>{account.name}</strong>
                                        </td>
                                        <td>{account.type}</td>
                                        <td>{account.level}</td>
                                        <td>
                                            <span className={`badge ${account.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                                                {account.active === 'Y' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEdit(account)}
                                                title="Edit"
                                                style={{ marginRight: '0.5rem' }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleDelete(account.id)}
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
                            <h3>{editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Kode Akun</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                    placeholder="Contoh: 1000"
                                />
                            </div>
                            <div className="form-group">
                                <label>Nama Akun</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Contoh: KAS BESAR"
                                />
                            </div>
                            <div className="form-group">
                                <label>Tipe</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    {accountTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Level</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
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
                            </div>
                            <div className="form-group">
                                <label>Parent Account (Induk)</label>
                                <select
                                    value={formData.parent_id}
                                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                >
                                    <option value="">-- Tidak ada (Level 1) --</option>
                                    {accounts
                                        .filter(acc => acc.id !== editingAccount?.id) // Prevent selecting self as parent
                                        .map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </option>
                                        ))
                                    }
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

export default CoaList;
