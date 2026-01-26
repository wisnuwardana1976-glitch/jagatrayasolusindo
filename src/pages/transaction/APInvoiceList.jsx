import { useState, useEffect } from 'react';

function APInvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [receivings, setReceivings] = useState([]);
    const [items, setItems] = useState([]);
    const [transcodes, setTranscodes] = useState([]);

    // "sourceType": 'receiving' | 'manual'
    const [sourceType, setSourceType] = useState('receiving');

    const [formData, setFormData] = useState({
        doc_number: '',
        doc_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        transcode_id: '',
        partner_id: '',
        receiving_id: '',
        status: 'Draft',
        status: 'Draft',
        notes: '',
        items: [],
        tax_type: 'Exclude'
    });

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ap-invoices');
            const data = await response.json();
            if (data.success) {
                setInvoices(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchMasterData = async () => {
        try {
            const [supRes, recRes, itemRes, transRes] = await Promise.all([
                fetch('/api/partners?type=Supplier'),
                fetch('/api/receivings'),
                fetch('/api/items'),
                fetch('/api/transcodes')
            ]);
            const supData = await supRes.json();
            const recData = await recRes.json();
            const itemData = await itemRes.json();
            const transData = await transRes.json();

            if (supData.success) setSuppliers(supData.data);
            if (recData.success) {
                // Only show Approved receivings for selection
                setReceivings(recData.data.filter(r => r.status === 'Approved'));
            }
            if (itemData.success) setItems(itemData.data);
            if (transData.success) {
                // Filter for AP Invoice transcode (nomortranscode === 7)
                setTranscodes(transData.data.filter(t => t.active === 'Y' && t.nomortranscode === 7));
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

    const handleSelectReceiving = async (recId) => {
        if (!recId) {
            setFormData(prev => ({
                ...prev,
                receiving_id: '',
                partner_id: '',
                items: []
            }));
            return;
        }

        try {
            const response = await fetch(`/api/receivings/${recId}`);
            const data = await response.json();
            if (data.success) {
                const rec = data.data;
                const recDetails = rec.details || [];

                setFormData(prev => ({
                    ...prev,
                    receiving_id: rec.id,
                    partner_id: rec.partner_id,
                    items: recDetails.map(d => ({
                        item_id: d.item_id,
                        description: d.item_name || '', // Use item name or remarks
                        quantity: parseFloat(d.quantity),
                        unit_price: parseFloat(d.unit_price) || 0, // Price from PO
                        amount: 0,
                        receiving_id: rec.id
                    })),
                    tax_type: rec.tax_type || 'Exclude'
                }));
            }
        } catch (error) {
            console.error('Error fetching Receiving details:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const MyDate = new Date();
            const url = editingItem ? `/api/ap-invoices/${editingItem}` : '/api/ap-invoices';
            const method = editingItem ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                items: formData.items.map(item => ({
                    ...item,
                    amount: parseFloat(item.quantity) * parseFloat(item.unit_price)
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
            const response = await fetch(`/api/ap-invoices/${id}`);
            const data = await response.json();
            if (data.success) {
                const inv = data.data;
                setFormData({
                    doc_number: inv.doc_number,
                    doc_date: new Date(inv.doc_date).toISOString().split('T')[0],
                    due_date: inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : '',
                    transcode_id: inv.transcode_id || '',
                    partner_id: inv.partner_id || '',
                    receiving_id: inv.receiving_id || '',
                    status: inv.status,
                    notes: inv.notes || '',
                    items: inv.details.map(d => ({
                        item_id: d.item_id,
                        description: d.description,
                        quantity: parseFloat(d.quantity),
                        unit_price: parseFloat(d.unit_price),
                        amount: parseFloat(d.amount),
                        amount: parseFloat(d.amount),
                        receiving_id: d.receiving_id
                    })),
                    tax_type: inv.tax_type || 'Exclude'
                });

                setSourceType(inv.receiving_id ? 'receiving' : 'manual');
                setEditingItem(id);
                setShowForm(true);
            }
        } catch (error) {
            alert('Error fetching details: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Invoice ini?')) return;
        try {
            const response = await fetch(`/api/ap-invoices/${id}`, { method: 'DELETE' });
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

    const handlePost = async (id) => {
        if (!confirm('Post Invoice ini?')) return;
        try {
            const response = await fetch(`/api/ap-invoices/${id}/post`, { method: 'PUT' });
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
        if (!confirm('Unpost Invoice ini? Status kembali ke Draft.')) return;
        try {
            const response = await fetch(`/api/ap-invoices/${id}/unpost`, { method: 'PUT' });
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
            items: [...prev.items, { item_id: '', description: '', quantity: 1, unit_price: 0, amount: 0 }]
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        // Auto-calculate description if item selected
        if (field === 'item_id') {
            const item = items.find(i => i.id === parseInt(value));
            if (item) newItems[index].description = item.name;
        }
        setFormData({ ...formData, items: newItems });
    };

    const resetForm = () => {
        setEditingItem(null);
        setSourceType('receiving');
        setFormData({
            doc_number: 'AUTO',
            doc_date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            transcode_id: '',
            partner_id: '',
            receiving_id: '',
            status: 'Draft',
            notes: '',
            items: [],
            tax_type: 'Exclude'
        });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('id-ID');
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };

    const calculatePPN = () => {
        if (formData.tax_type === 'No Tax') return 0;

        const subtotal = calculateSubtotal();
        if (formData.tax_type === 'Include') {
            const taxBase = subtotal / 1.11;
            return subtotal - taxBase;
        } else {
            return subtotal * 0.11;
        }
    };

    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        const ppn = calculatePPN();

        if (formData.tax_type === 'Include') {
            return subtotal;
        } else {
            return subtotal + ppn;
        }
    };

    const getFooterDisplay = () => {
        const subtotal = calculateSubtotal();
        const ppn = calculatePPN();

        if (formData.tax_type === 'Include') {
            const taxBase = subtotal / 1.11;
            return {
                subtotalLabel: 'Subtotal (Gross)',
                subtotalValue: subtotal,
                taxBaseLabel: 'DPP (Tax Base)',
                taxBaseValue: taxBase,
                ppnValue: ppn
            };
        }

        return {
            subtotalLabel: 'Subtotal',
            subtotalValue: subtotal,
            taxBaseLabel: null,
            taxBaseValue: null,
            ppnValue: ppn
        };
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">AP Invoice / Tagihan Pembelian</h1>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                    + Buat Invoice Baru
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Invoice' : 'Buat Invoice Baru'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>No. Dokumen</label>
                                    <input
                                        type="text"
                                        value={formData.doc_number}
                                        onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })}
                                        required
                                        placeholder="Otomatis"
                                        readOnly
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
                                    <label>Tanggal Invoice</label>
                                    <input
                                        type="date"
                                        value={formData.doc_date}
                                        onChange={(e) => setFormData({ ...formData, doc_date: e.target.value })}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Jatuh Tempo</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        disabled={formData.status !== 'Draft'}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Sumber Data</label>
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                                        <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <input
                                                type="radio"
                                                name="sourceType"
                                                checked={sourceType === 'receiving'}
                                                onChange={() => {
                                                    setSourceType('receiving');
                                                    setFormData(prev => ({ ...prev, receiving_id: '', items: [] }));
                                                }}
                                                disabled={editingItem || formData.status !== 'Draft'}
                                            />
                                            <span style={{ marginLeft: '5px' }}>Dari Receiving</span>
                                        </label>
                                        <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <input
                                                type="radio"
                                                name="sourceType"
                                                checked={sourceType === 'manual'}
                                                onChange={() => {
                                                    setSourceType('manual');
                                                    setFormData(prev => ({ ...prev, receiving_id: '', items: [] }));
                                                }}
                                                disabled={editingItem || formData.status !== 'Draft'}
                                            />
                                            <span style={{ marginLeft: '5px' }}>Input Manual</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                {sourceType === 'receiving' && (
                                    <div className="form-group">
                                        <label>Receiving (Approved)</label>
                                        <select
                                            value={formData.receiving_id}
                                            onChange={(e) => handleSelectReceiving(e.target.value)}
                                            disabled={editingItem || formData.status !== 'Draft'}
                                        >
                                            <option value="">-- Pilih Receiving --</option>
                                            {receivings.map(rec => (
                                                <option key={rec.id} value={rec.id}>
                                                    {rec.doc_number} - {rec.partner_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Supplier</label>
                                    <select
                                        value={formData.partner_id}
                                        onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                                        required
                                        disabled={formData.receiving_id || formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Supplier --</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
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
                                    <h4>Daftar Tagihan</h4>
                                    <button type="button" className="btn btn-outline" onClick={handleAddItem} disabled={formData.status !== 'Draft'}>+ Tambah Item/Jasa</button>
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Item (Opsional)</th>
                                            <th>Deskripsi</th>
                                            <th style={{ width: '80px' }}>Qty</th>
                                            <th style={{ width: '120px' }}>Harga Satuan</th>
                                            <th style={{ width: '120px' }}>Total</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>
                                                    {sourceType === 'receiving' && !formData.receiving_id ? 'Pilih Receiving terlebih dahulu.' : 'Belum ada item.'}
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
                                                            disabled={formData.receiving_id || formData.status !== 'Draft'}
                                                        >
                                                            <option value="">-- Non-Inventory --</option>
                                                            {items.map(i => (
                                                                <option key={i.id} value={i.id}>{i.code} - {i.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                                            required
                                                            disabled={formData.status !== 'Draft'}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="0"
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
                                                            value={item.unit_price}
                                                            onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                            required
                                                            style={{ width: '100%' }}
                                                            disabled={formData.status !== 'Draft'}
                                                        />
                                                    </td>
                                                    <td>
                                                        {formatMoney((item.quantity || 0) * (item.unit_price || 0))}
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn-icon" onClick={() => handleRemoveItem(idx)} disabled={formData.status !== 'Draft'}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        {(() => {
                                            const display = getFooterDisplay();
                                            return (
                                                <>
                                                    <tr>
                                                        <td colSpan="4" style={{ textAlign: 'right' }}>{display.subtotalLabel}:</td>
                                                        <td style={{ fontWeight: 'bold' }}>
                                                            {formatMoney(display.subtotalValue)}
                                                        </td>
                                                        <td></td>
                                                    </tr>

                                                    {display.taxBaseLabel && (
                                                        <tr>
                                                            <td colSpan="4" style={{ textAlign: 'right', color: '#666' }}>{display.taxBaseLabel}:</td>
                                                            <td style={{ color: '#666' }}>{formatMoney(display.taxBaseValue)}</td>
                                                            <td></td>
                                                        </tr>
                                                    )}

                                                    <tr>
                                                        <td colSpan="4" style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                                Pajak (PPN 11%):
                                                                <select
                                                                    value={formData.tax_type}
                                                                    onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                                                                    style={{ width: 'auto', padding: '0.2rem', fontSize: '0.9rem' }}
                                                                    disabled={formData.status !== 'Draft' || !!formData.receiving_id}
                                                                >
                                                                    <option value="Exclude">Exclude (Tambah)</option>
                                                                    <option value="Include">Include (Termasuk)</option>
                                                                    <option value="No Tax">No Tax (Tanpa Pajak)</option>
                                                                </select>
                                                            </div>
                                                        </td>
                                                        <td style={{ fontWeight: 'bold' }}>{formatMoney(display.ppnValue)}</td>
                                                        <td></td>
                                                    </tr>

                                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                        <td colSpan="4" style={{ textAlign: 'right' }}>Grand Total:</td>
                                                        <td style={{ fontWeight: 'bold' }}>
                                                            {formatMoney(calculateGrandTotal())}
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                </>
                                            );
                                        })()}
                                    </tfoot>
                                </table>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                                    {formData.status !== 'Draft' ? 'Tutup' : 'Batal'}
                                </button>
                                {formData.status === 'Draft' && (
                                    <button type="submit" className="btn btn-primary">{editingItem ? 'Update Invoice' : 'Simpan Invoice'}</button>
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
                                <th>No. Receiving</th>
                                <th>jth Tempo</th>
                                <th>Supplier</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada AP Invoice</td>
                                </tr>
                            ) : (
                                invoices.map(inv => (
                                    <tr key={inv.id}>
                                        <td>{formatDate(inv.doc_date)}</td>
                                        <td><strong>{inv.doc_number}</strong></td>
                                        <td>{inv.receiving_number || '-'}</td>
                                        <td>{inv.due_date ? formatDate(inv.due_date) : '-'}</td>
                                        <td>{inv.partner_name || '-'}</td>
                                        <td>
                                            <span className={`badge ${inv.status === 'Draft' ? 'badge-warning' : 'badge-success'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {inv.status === 'Draft' ? (
                                                <>
                                                    <button className="btn-icon" onClick={() => handlePost(inv.id)} title="Post" style={{ color: 'green', marginRight: '5px' }}>✅</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(inv.id)} title="Edit" style={{ marginRight: '5px' }}>✏️</button>
                                                    <button className="btn-icon" onClick={() => handleDelete(inv.id)} title="Hapus">🗑️</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="btn-icon" onClick={() => handleUnpost(inv.id)} title="Unpost" style={{ color: 'orange', marginRight: '5px' }}>🔓</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(inv.id)} title="Lihat Detail" style={{ color: 'blue' }}>👁️</button>
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

export default APInvoiceList;
