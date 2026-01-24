import { useState, useEffect } from 'react';

function ItemList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        unit: '',
        standard_cost: 0,
        standard_price: 0
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/items');
            const data = await response.json();
            if (data.success) {
                setItems(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items';
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
                fetchItems();
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
            unit: item.unit || '',
            standard_cost: item.standard_cost || 0,
            standard_price: item.standard_price || 0
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus item ini?')) return;
        try {
            const response = await fetch(`/api/items/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchItems();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({ code: '', name: '', unit: '', standard_cost: 0, standard_price: 0 });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value || 0);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Item</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingItem(null); resetForm(); }}>
                    + Tambah Item
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Item' : 'Tambah Item Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingItem(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Kode Item</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nama Item</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Satuan</label>
                                <input
                                    type="text"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    placeholder="pcs, kg, box, dll"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Harga Beli (Cost)</label>
                                    <input
                                        type="number"
                                        value={formData.standard_cost}
                                        onChange={(e) => setFormData({ ...formData, standard_cost: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Harga Jual (Price)</label>
                                    <input
                                        type="number"
                                        value={formData.standard_price}
                                        onChange={(e) => setFormData({ ...formData, standard_price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
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
                                <th>Nama Item</th>
                                <th>Satuan</th>
                                <th style={{ textAlign: 'right' }}>Harga Beli</th>
                                <th style={{ textAlign: 'right' }}>Harga Jual</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data item
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id}>
                                        <td><strong>{item.code}</strong></td>
                                        <td>{item.name}</td>
                                        <td>{item.unit}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.standard_cost)}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.standard_price)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(item)} title="Edit">✏️</button>
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

export default ItemList;
