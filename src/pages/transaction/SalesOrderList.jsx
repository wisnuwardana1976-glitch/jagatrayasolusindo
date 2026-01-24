import { useState, useEffect } from 'react';

function SalesOrderList() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [salesPersons, setSalesPersons] = useState([]);
    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState({
        doc_number: '',
        doc_date: new Date().toISOString().split('T')[0],
        partner_id: '',
        salesperson_id: '',
        status: 'Draft',
        salesperson_id: '',
        status: 'Draft',
        details: [],
        transcode_id: ''
    });
    const [transcodes, setTranscodes] = useState([]);

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/sales-orders');
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
            const [custRes, spRes, itemRes, transRes] = await Promise.all([
                fetch('/api/partners?type=Customer'),
                fetch('/api/salespersons'),
                fetch('/api/items'),
                fetch('/api/transcodes')
            ]);
            const custData = await custRes.json();
            const spData = await spRes.json();
            const itemData = await itemRes.json();
            const transData = await transRes.json();

            if (custData.success) setCustomers(custData.data);
            if (spData.success) setSalesPersons(spData.data);
            if (itemData.success) setItems(itemData.data);
            if (transData.success) {
                // Filter specifically for SO (nomortranscode = 2)
                const soTranscodes = transData.data.filter(t => t.active === 'Y' && t.nomortranscode === 2);
                setTranscodes(soTranscodes);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const generateNumber = async (code) => {
        try {
            const response = await fetch(`/api/transcodes/${code}/generate`);
            const data = await response.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, doc_number: data.doc_number }));
            } else {
                alert('Gagal generate nomor dokumen: ' + data.error);
            }
        } catch (error) {
            console.error('Error generating number:', error);
        }
    };

    const generateDocNumber = () => {
        const date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `SO-${y}${m}${d}-${rand}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.details.length === 0) {
            alert('Tambahkan minimal 1 item!');
            return;
        }
        try {
            const response = await fetch('/api/sales-orders', {
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
        if (!confirm('Yakin ingin menghapus Sales Order ini?')) return;
        try {
            const response = await fetch(`/api/sales-orders/${id}`, { method: 'DELETE' });
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
                newDetails[index].unit_price = item.standard_price || 0;
            }
        }

        setFormData({ ...formData, details: newDetails });
    };

    const resetForm = () => {
        setFormData({
            doc_number: '', // Auto-generated based on selection
            doc_date: new Date().toISOString().split('T')[0],
            partner_id: '',
            salesperson_id: '',
            status: 'Draft',
            details: [],
            transcode_id: ''
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
                <h1 className="page-title">Sales Order</h1>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                    + Buat SO Baru
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <div className="modal-header">
                            <h3>Buat Sales Order Baru</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tipe Transaksi</label>
                                    <select
                                        value={formData.transcode_id}
                                        onChange={(e) => {
                                            const selectedId = parseInt(e.target.value);
                                            const selectedTranscode = transcodes.find(t => t.id === selectedId);
                                            setFormData({ ...formData, transcode_id: selectedId });
                                            if (selectedTranscode) {
                                                generateNumber(selectedTranscode.code);
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">-- Pilih Tipe Transaksi --</option>
                                        {transcodes.map(tc => (
                                            <option key={tc.id} value={tc.id}>{tc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>No. Dokumen</label>
                                    <input type="text" value={formData.doc_number} readOnly placeholder="Otomatis" />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.doc_date}
                                        onChange={(e) => setFormData({ ...formData, doc_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Customer</label>
                                    <select
                                        value={formData.partner_id}
                                        onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Pilih Customer --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Sales Person</label>
                                    <select
                                        value={formData.salesperson_id}
                                        onChange={(e) => setFormData({ ...formData, salesperson_id: e.target.value })}
                                    >
                                        <option value="">-- Pilih Sales --</option>
                                        {salesPersons.map(sp => (
                                            <option key={sp.id} value={sp.id}>{sp.code} - {sp.name}</option>
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
                                <button type="submit" className="btn btn-primary">Simpan SO</button>
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
                                <th>Customer</th>
                                <th>Sales</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Belum ada data Sales Order
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id}>
                                        <td><strong>{order.doc_number}</strong></td>
                                        <td>{formatDate(order.doc_date)}</td>
                                        <td>{order.partner_name || '-'}</td>
                                        <td>{order.salesperson_name || '-'}</td>
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

export default SalesOrderList;
