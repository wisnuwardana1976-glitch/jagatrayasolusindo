import { useState, useEffect } from 'react';

function PurchaseOrderList() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState({
        doc_number: '',
        doc_date: new Date().toISOString().split('T')[0],
        partner_id: '',
        status: 'Draft',
        details: []
    });

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/purchase-orders');
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchMasterData = async () => {
        try {
            const [suppRes, itemRes] = await Promise.all([
                fetch('/api/partners?type=Supplier'),
                fetch('/api/items')
            ]);
            const suppData = await suppRes.json();
            const itemData = await itemRes.json();
            if (suppData.success) setSuppliers(suppData.data);
            if (itemData.success) setItems(itemData.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const generateDocNumber = () => {
        const date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PO-${y}${m}${d}-${rand}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.details.length === 0) {
            alert('Tambahkan minimal 1 item!');
            return;
        }
        try {
            const response = await fetch('/api/purchase-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                resetForm();
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Purchase Order ini?')) return;
        try {
            const response = await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const addDetailLine = () => {
        setFormData({
            ...formData,
            details: [...formData.details, { item_id: '', quantity: 1, unit_price: 0 }]
        });
    };

    const removeDetailLine = (index) => {
        const newDetails = formData.details.filter((_, i) => i !== index);
        setFormData({ ...formData, details: newDetails });
    };

    const updateDetailLine = (index, field, value) => {
        const newDetails = [...formData.details];
        newDetails[index][field] = value;

        // Auto-fill price from item
        if (field === 'item_id') {
            const item = items.find(i => i.id === parseInt(value));
            if (item) {
                newDetails[index].unit_price = item.standard_cost || 0;
            }
        }

        setFormData({ ...formData, details: newDetails });
    };

    const resetForm = () => {
        setFormData({
            doc_number: generateDocNumber(),
            doc_date: new Date().toISOString().split('T')[0],
            partner_id: '',
            status: 'Draft',
            details: []
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('id-ID');
    };

    const calculateTotal = () => {
        return formData.details.reduce((sum, d) => sum + (d.quantity * d.unit_price), 0);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Purchase Order</h1>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                    + Buat PO Baru
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <div className="modal-header">
                            <h3>Buat Purchase Order Baru</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>No. Dokumen</label>
                                    <input type="text" value={formData.doc_number} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.doc_date}
                                        onChange={(e) => setFormData({ ...formData, doc_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Supplier</label>
                                    <select
                                        value={formData.partner_id}
                                        onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Pilih Supplier --</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Detail Items */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <h4>Detail Item</h4>
                                    <button type="button" className="btn btn-outline" onClick={addDetailLine}>+ Tambah Baris</button>
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th style={{ width: '100px' }}>Qty</th>
                                            <th style={{ width: '150px' }}>Harga</th>
                                            <th style={{ width: '150px' }}>Total</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.details.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>
                                                    Belum ada item. Klik "Tambah Baris" untuk menambah item.
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.details.map((detail, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <select
                                                            value={detail.item_id}
                                                            onChange={(e) => updateDetailLine(idx, 'item_id', e.target.value)}
                                                            required
                                                        >
                                                            <option value="">-- Pilih Item --</option>
                                                            {items.map(i => (
                                                                <option key={i.id} value={i.id}>{i.code} - {i.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={detail.quantity}
                                                            onChange={(e) => updateDetailLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={detail.unit_price}
                                                            onChange={(e) => updateDetailLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        {formatCurrency(detail.quantity * detail.unit_price)}
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn-icon" onClick={() => removeDetailLine(idx)}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(calculateTotal())}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">Simpan PO</button>
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
                                <th>No. Dokumen</th>
                                <th>Tanggal</th>
                                <th>Supplier</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data Purchase Order
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id}>
                                        <td><strong>{order.doc_number}</strong></td>
                                        <td>{formatDate(order.doc_date)}</td>
                                        <td>{order.partner_name || '-'}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(order.total_amount)}</td>
                                        <td>
                                            <span className={`badge ${order.status === 'Draft' ? 'badge-warning' : order.status === 'Approved' ? 'badge-success' : 'badge-info'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleDelete(order.id)} title="Hapus">🗑️</button>
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

export default PurchaseOrderList;
