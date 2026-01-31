import { useState, useEffect } from 'react';
import { usePeriod } from '../../context/PeriodContext';

function InventoryAdjustmentList({ adjustmentType = 'IN' }) {
    const { selectedPeriod } = usePeriod();
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [items, setItems] = useState([]);
    const [transcodes, setTranscodes] = useState([]);

    const [formData, setFormData] = useState({
        doc_number: 'AUTO',
        doc_date: new Date().toISOString().split('T')[0],
        adjustment_type: adjustmentType,
        transcode_id: '',
        warehouse_id: '',
        counter_account_id: '',
        notes: '',
        status: 'Draft',
        items: []
    });

    const title = adjustmentType === 'IN' ? 'Inventory Adjustment In' : 'Inventory Adjustment Out';
    const subtitle = adjustmentType === 'IN' ? 'Penambahan Stok' : 'Pengurangan Stok';

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, [selectedPeriod, adjustmentType]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/inventory-adjustments';
            const params = new URLSearchParams();
            if (selectedPeriod) {
                params.append('startDate', new Date(selectedPeriod.start_date).toISOString().split('T')[0]);
                params.append('endDate', new Date(selectedPeriod.end_date).toISOString().split('T')[0]);
            }
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setAdjustments(data.data.filter(a => a.adjustment_type === adjustmentType));
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchMasterData = async () => {
        try {
            const [whRes, accRes, itemRes, transRes] = await Promise.all([
                fetch('/api/warehouses'),
                fetch('/api/accounts'),
                fetch('/api/items'),
                fetch('/api/transcodes')
            ]);
            const whData = await whRes.json();
            const accData = await accRes.json();
            const itemData = await itemRes.json();
            const transData = await transRes.json();

            if (whData.success) setWarehouses(whData.data);
            if (accData.success) setAccounts(accData.data);
            if (itemData.success) setItems(itemData.data);
            if (transData.success) {
                // Filter transcodes for inventory adjustment (nomortranscode = 10 for IN, 11 for OUT)
                const transCodeNum = adjustmentType === 'IN' ? 20 : 21;
                setTranscodes(transData.data.filter(t => t.active === 'Y' && t.nomortranscode === transCodeNum));
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
            }
        } catch (error) {
            console.error('Error generating number:', error);
        }
    };

    const fetchAverageCost = async (itemId, warehouseId) => {
        try {
            const response = await fetch(`/api/items/${itemId}/average-cost?warehouse_id=${warehouseId}`);
            const data = await response.json();
            return data.average_cost || 0;
        } catch (error) {
            console.error('Error fetching average cost:', error);
            return 0;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/inventory-adjustments/${editingItem}` : '/api/inventory-adjustments';
            const method = editingItem ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                items: formData.items.map(item => ({
                    ...item,
                    amount: parseFloat(item.quantity) * parseFloat(item.unit_cost)
                }))
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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

    const handleEdit = async (id) => {
        try {
            const response = await fetch(`/api/inventory-adjustments/${id}`);
            const data = await response.json();
            if (data.success) {
                const adj = data.data;
                setFormData({
                    doc_number: adj.doc_number,
                    doc_date: new Date(adj.doc_date).toISOString().split('T')[0],
                    adjustment_type: adj.adjustment_type,
                    transcode_id: adj.transcode_id || '',
                    warehouse_id: adj.warehouse_id || '',
                    counter_account_id: adj.counter_account_id || '',
                    notes: adj.notes || '',
                    status: adj.status,
                    items: adj.details.map(d => ({
                        item_id: d.item_id,
                        quantity: parseFloat(d.quantity),
                        unit_cost: parseFloat(d.unit_cost),
                        amount: parseFloat(d.amount),
                        notes: d.notes || ''
                    }))
                });
                setEditingItem(id);
                setShowForm(true);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Adjustment ini?')) return;
        try {
            const response = await fetch(`/api/inventory-adjustments/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleApprove = async (id) => {
        if (!confirm('Approve Adjustment ini?')) return;
        try {
            const response = await fetch(`/api/inventory-adjustments/${id}/approve`, { method: 'PUT' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handlePost = async (id) => {
        if (!confirm('Post Adjustment ini? Stok akan diupdate.')) return;
        try {
            const response = await fetch(`/api/inventory-adjustments/${id}/post`, { method: 'PUT' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleUnapprove = async (id) => {
        if (!confirm('Batalkan Approve Adjustment ini? Status akan kembali menjadi Draft.')) return;
        try {
            const response = await fetch(`/api/inventory-adjustments/${id}/unapprove`, { method: 'PUT' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleUnpost = async (id) => {
        if (!confirm('Unpost Adjustment ini? Stok akan dikembalikan dan jurnal dihapus.')) return;
        try {
            const response = await fetch(`/api/inventory-adjustments/${id}/unpost`, { method: 'PUT' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { item_id: '', quantity: 1, unit_cost: 0, amount: 0, notes: '' }]
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = async (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // Auto-fetch average cost when item is selected
        if (field === 'item_id' && value && formData.warehouse_id) {
            const avgCost = await fetchAverageCost(value, formData.warehouse_id);
            newItems[index].unit_cost = avgCost;
            newItems[index].amount = parseFloat(newItems[index].quantity || 0) * avgCost;
        }

        // Recalculate amount
        if (field === 'quantity' || field === 'unit_cost') {
            newItems[index].amount = parseFloat(newItems[index].quantity || 0) * parseFloat(newItems[index].unit_cost || 0);
        }

        setFormData({ ...formData, items: newItems });
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            doc_number: 'AUTO',
            doc_date: new Date().toISOString().split('T')[0],
            adjustment_type: adjustmentType,
            transcode_id: '',
            warehouse_id: '',
            counter_account_id: '',
            notes: '',
            status: 'Draft',
            items: []
        });
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('id-ID');
    const formatMoney = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_cost || 0)), 0);
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Draft': 'badge-warning',
            'Approved': 'badge-info',
            'Posted': 'badge-success'
        };
        return badges[status] || 'badge-secondary';
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{title}</h1>
                    <p style={{ color: '#666', margin: 0 }}>{subtitle}</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                    + Buat Adjustment Baru
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Adjustment' : 'Buat Adjustment Baru'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>No. Dokumen</label>
                                    <input
                                        type="text"
                                        value={formData.doc_number}
                                        readOnly
                                        placeholder="Otomatis"
                                    />
                                </div>
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
                                        disabled={formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Tipe --</option>
                                        {transcodes.map(t => (
                                            <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.doc_date}
                                        onChange={(e) => setFormData({ ...formData, doc_date: e.target.value })}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Warehouse</label>
                                    <select
                                        value={formData.warehouse_id}
                                        onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Warehouse --</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Counter Account (COA)</label>
                                    <select
                                        value={formData.counter_account_id}
                                        onChange={(e) => setFormData({ ...formData, counter_account_id: e.target.value })}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Akun Lawan --</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Keterangan</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="2"
                                    disabled={formData.status !== 'Draft'}
                                />
                            </div>

                            <div className="form-section">
                                <div className="form-section-header">
                                    <h4>Daftar Item</h4>
                                    <button type="button" className="btn btn-outline" onClick={handleAddItem} disabled={formData.status !== 'Draft' || !formData.warehouse_id}>
                                        + Tambah Item
                                    </button>
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th style={{ width: '100px' }}>Qty</th>
                                            <th style={{ width: '150px' }}>Unit Cost (Avg)</th>
                                            <th style={{ width: '150px' }}>Total</th>
                                            <th style={{ width: '150px' }}>Catatan</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>
                                                    {!formData.warehouse_id ? 'Pilih Warehouse terlebih dahulu.' : 'Belum ada item.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <select
                                                            value={item.item_id}
                                                            onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
                                                            style={{ width: '100%' }}
                                                            disabled={formData.status !== 'Draft'}
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
                                                            min="0.0001"
                                                            step="any"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                            required
                                                            style={{ width: '100%' }}
                                                            disabled={formData.status !== 'Draft'}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            value={item.unit_cost}
                                                            onChange={(e) => handleItemChange(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                                                            required
                                                            style={{ width: '100%' }}
                                                            disabled={formData.status !== 'Draft'}
                                                        />
                                                    </td>
                                                    <td>
                                                        {formatMoney((item.quantity || 0) * (item.unit_cost || 0))}
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={item.notes || ''}
                                                            onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                                                            style={{ width: '100%' }}
                                                            disabled={formData.status !== 'Draft'}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn-icon" onClick={() => handleRemoveItem(idx)} disabled={formData.status !== 'Draft'}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                            <td colSpan="3" style={{ textAlign: 'right' }}>Grand Total:</td>
                                            <td>{formatMoney(calculateTotal())}</td>
                                            <td colSpan="2"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                                    {formData.status !== 'Draft' ? 'Tutup' : 'Batal'}
                                </button>
                                {formData.status === 'Draft' && (
                                    <button type="submit" className="btn btn-primary">
                                        {editingItem ? 'Update Adjustment' : 'Simpan Adjustment'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List Table */}
            <div className="card">
                {loading ? (
                    <div className="loading"><div className="loading-spinner"></div><p>Memuat data...</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>No. Dokumen</th>
                                <th>Warehouse</th>
                                <th>Counter Account</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adjustments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada Adjustment</td>
                                </tr>
                            ) : (
                                adjustments.map(adj => (
                                    <tr key={adj.id}>
                                        <td>{formatDate(adj.doc_date)}</td>
                                        <td><strong>{adj.doc_number}</strong></td>
                                        <td>{adj.warehouse_name || '-'}</td>
                                        <td>{adj.counter_account_name || '-'}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(adj.status)}`}>
                                                {adj.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {adj.status === 'Draft' && (
                                                <>
                                                    <button className="btn-icon" onClick={() => handleApprove(adj.id)} title="Approve" style={{ color: 'blue', marginRight: '5px' }}>✓</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(adj.id)} title="Edit" style={{ marginRight: '5px' }}>✏️</button>
                                                    <button className="btn-icon" onClick={() => handleDelete(adj.id)} title="Hapus">🗑️</button>
                                                </>
                                            )}
                                            {adj.status === 'Approved' && (
                                                <>
                                                    <button className="btn-icon" onClick={() => handlePost(adj.id)} title="Post" style={{ color: 'green', marginRight: '5px' }}>✅</button>
                                                    <button className="btn-icon" onClick={() => handleUnapprove(adj.id)} title="Batal Approve" style={{ color: 'red', marginRight: '5px' }}>✕</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(adj.id)} title="Lihat Detail" style={{ color: 'blue' }}>👁️</button>
                                                </>
                                            )}
                                            {adj.status === 'Posted' && (
                                                <>
                                                    <button className="btn-icon" onClick={() => handleUnpost(adj.id)} title="Unpost" style={{ color: 'orange', marginRight: '5px' }}>↩️</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(adj.id)} title="Lihat Detail" style={{ color: 'blue' }}>👁️</button>
                                                </>
                                            )}
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

export default InventoryAdjustmentList;
