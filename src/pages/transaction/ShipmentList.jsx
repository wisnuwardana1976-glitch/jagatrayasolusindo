import { useState, useEffect } from 'react';

import { usePeriod } from '../../context/PeriodContext';

function ShipmentList() {
    const { selectedPeriod } = usePeriod();
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [salesOrders, setSalesOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [transcodes, setTranscodes] = useState([]); // Add transcode state

    // "sourceType": 'so' | 'manual'
    const [sourceType, setSourceType] = useState('so');

    const [formData, setFormData] = useState({
        doc_number: '',
        doc_date: new Date().toISOString().split('T')[0],
        transcode_id: '',
        so_id: '',
        partner_id: '',
        status: 'Draft',
        notes: '',
        items: []
    });

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, [selectedPeriod]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/shipments';
            if (selectedPeriod) {
                const formatDate = (d) => new Date(d).toISOString().split('T')[0];
                const query = new URLSearchParams({
                    startDate: formatDate(selectedPeriod.start_date),
                    endDate: formatDate(selectedPeriod.end_date)
                }).toString();
                url += `?${query}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setShipments(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchMasterData = async () => {
        try {
            const [soRes, custRes, itemRes, transRes] = await Promise.all([
                fetch('/api/sales-orders'),
                fetch('/api/partners?type=Customer'),
                fetch('/api/items'),
                fetch('/api/transcodes')
            ]);
            const soData = await soRes.json();
            const custData = await custRes.json();
            const itemData = await itemRes.json();
            const transData = await transRes.json();

            if (soData.success) {
                setSalesOrders(soData.data);
            }
            if (custData.success) setCustomers(custData.data);
            if (itemData.success) setItems(itemData.data);
            if (transData.success) {
                // Filter for Shipment transcode (nomortranscode = 4)
                setTranscodes(transData.data.filter(t => t.active === 'Y' && t.nomortranscode === 4));
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

    const handleSelectSO = async (soId) => {
        if (!soId) {
            setFormData(prev => ({
                ...prev,
                so_id: '',
                partner_id: '',
                items: []
            }));
            return;
        }

        try {
            const response = await fetch(`/api/sales-orders/${soId}`);
            const data = await response.json();
            if (data.success) {
                const so = data.data;
                const soDetails = so.details || [];

                setFormData(prev => ({
                    ...prev,
                    so_id: so.id,
                    partner_id: so.partner_id,
                    items: soDetails.map(d => {
                        const ordered = parseFloat(d.quantity);
                        const shipped = parseFloat(d.qty_shipped || 0);
                        const outstanding = Math.max(0, ordered - shipped);
                        return {
                            item_id: d.item_id,
                            quantity: outstanding,
                            remarks: ''
                        };
                    })
                }));
            }
        } catch (error) {
            console.error('Error fetching SO details:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/shipments/${editingItem}` : '/api/shipments';
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
            const response = await fetch(`/api/shipments/${id}`);
            const data = await response.json();
            if (data.success) {
                const ship = data.data;
                setFormData({
                    doc_number: ship.doc_number,
                    doc_date: new Date(ship.doc_date).toISOString().split('T')[0],
                    transcode_id: ship.transcode_id || '',
                    so_id: ship.so_id || '',
                    partner_id: ship.partner_id || '',
                    status: ship.status,
                    notes: ship.notes || '',
                    items: ship.details.map(d => ({
                        item_id: d.item_id,
                        quantity: parseFloat(d.quantity),
                        remarks: d.remarks || ''
                    }))
                });

                // Determine source type
                setSourceType(ship.so_id ? 'so' : 'manual');

                setEditingItem(id);
                setShowForm(true);
            }
        } catch (error) {
            alert('Error fetching details: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Shipment ini?')) return;
        try {
            const response = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
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
        if (!confirm('Post Shipment ini? Stok akan berkurang dan jurnal terbentuk.')) return;
        try {
            const response = await fetch(`/api/shipments/${id}/approve`, { method: 'PUT' });
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
        if (!confirm('Unpost Shipment ini? Status kembali ke Draft dan jurnal dihapus.')) return;
        try {
            const response = await fetch(`/api/shipments/${id}/unapprove`, { method: 'PUT' });
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
            items: [...prev.items, { item_id: '', quantity: 1, remarks: '' }]
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
        setFormData({ ...formData, items: newItems });
    };

    const resetForm = () => {
        setEditingItem(null);
        setSourceType('so');
        setFormData({
            doc_number: '', // Let user generate
            doc_date: new Date().toISOString().split('T')[0],
            transcode_id: '',
            so_id: '',
            partner_id: '',
            status: 'Draft',
            notes: '',
            items: []
        });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('id-ID');
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Shipment / Pengiriman</h1>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                    + Buat Shipment Baru
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Shipment' : 'Buat Shipment Baru'}</h3>
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
                                            if (selectedTranscode && !editingItem) {
                                                generateNumber(selectedTranscode.code);
                                            }
                                        }}
                                        required
                                        disabled={editingItem || formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Tipe --</option>
                                        {transcodes.map(tc => (
                                            <option key={tc.id} value={tc.id}>{tc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>No. Dokumen</label>
                                    <input
                                        type="text"
                                        value={formData.doc_number}
                                        onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })}
                                        required
                                        readOnly // Typically auto-generated
                                        placeholder="Otomatis"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.doc_date}
                                        onChange={(e) => setFormData({ ...formData, doc_date: e.target.value })}
                                        required
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
                                                checked={sourceType === 'so'}
                                                onChange={() => {
                                                    setSourceType('so');
                                                    setFormData(prev => ({ ...prev, so_id: '', items: [] }));
                                                }}
                                                disabled={editingItem || formData.status !== 'Draft'}
                                            />
                                            <span style={{ marginLeft: '5px' }}>Dari Sales Order</span>
                                        </label>
                                        <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <input
                                                type="radio"
                                                name="sourceType"
                                                checked={sourceType === 'manual'}
                                                onChange={() => {
                                                    setSourceType('manual');
                                                    setFormData(prev => ({ ...prev, so_id: '', items: [] }));
                                                }}
                                                disabled={editingItem || formData.status !== 'Draft'}
                                            />
                                            <span style={{ marginLeft: '5px' }}>Input Manual (Tanpa SO)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                {sourceType === 'so' && (
                                    <div className="form-group">
                                        <label>Sales Order</label>
                                        <select
                                            value={formData.so_id}
                                            onChange={(e) => handleSelectSO(e.target.value)}
                                            disabled={editingItem || formData.status !== 'Draft'}
                                        >
                                            <option value="">-- Pilih Sales Order --</option>
                                            {salesOrders.filter(so => !editingItem ? so.status === 'Approved' : true).map(so => (
                                                <option key={so.id} value={so.id}>
                                                    {so.doc_number} - {so.customer_name || 'No Name'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Customer</label>
                                    <select
                                        value={formData.partner_id}
                                        onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                                        required
                                        disabled={formData.so_id || formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Customer --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Keterangan / Alamat Kirim</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="2"
                                    disabled={formData.status !== 'Draft'}
                                />
                            </div>

                            <div className="form-section">
                                <div className="form-section-header">
                                    <h4>Daftar Barang</h4>
                                    <button type="button" className="btn btn-outline" onClick={handleAddItem} disabled={(sourceType === 'so' && !formData.so_id) || formData.status !== 'Draft'}>+ Tambah Manual</button>
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th style={{ width: '100px' }}>Qty Kirim</th>
                                            <th>Keterangan</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>
                                                    {sourceType === 'so' && !formData.so_id ? 'Pilih SO terlebih dahulu.' : 'Belum ada barang.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <select
                                                            value={item.item_id}
                                                            onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
                                                            required
                                                            disabled={formData.so_id || formData.status !== 'Draft'}
                                                            style={{ width: '100%' }}
                                                        >
                                                            <option value="">-- Pilih Item --</option>
                                                            {items.map(i => (
                                                                <option key={i.id} value={i.id}>{i.code} - {i.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="any"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                                required
                                                                style={{ width: '80px' }}
                                                                disabled={formData.status !== 'Draft'}
                                                            />
                                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                                                {items.find(i => i.id === parseInt(item.item_id))?.unit || ''}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={item.remarks}
                                                            onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                                                            placeholder="Catatan..."
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
                                </table>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                                    {formData.status !== 'Draft' ? 'Tutup' : 'Batal'}
                                </button>
                                {formData.status === 'Draft' && (
                                    <button type="submit" className="btn btn-primary">{editingItem ? 'Update Shipment' : 'Simpan Shipment'}</button>
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
                                <th>Customer</th>
                                <th>Dari SO</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shipments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data Shipment</td>
                                </tr>
                            ) : (
                                shipments.map(s => (
                                    <tr key={s.id}>
                                        <td>{formatDate(s.doc_date)}</td>
                                        <td><strong>{s.doc_number}</strong></td>
                                        <td>{s.customer_name || '-'}</td>
                                        <td>{s.so_number || '-'}</td>
                                        <td>
                                            <span className={`badge ${s.status === 'Draft' ? 'badge-warning' : 'badge-success'}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {s.status === 'Draft' ? (
                                                <>
                                                    <button className="btn-icon" onClick={() => handlePost(s.id)} title="Post" style={{ color: 'green', marginRight: '5px' }}>📮</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(s.id)} title="Edit" style={{ marginRight: '5px' }}>✏️</button>
                                                    <button className="btn-icon" onClick={() => handleDelete(s.id)} title="Hapus">🗑️</button>
                                                </>
                                            ) : (
                                                (() => {
                                                    const isLocked = parseFloat(s.total_billed || 0) >= parseFloat(s.total_shipped || 0) && parseFloat(s.total_shipped || 0) > 0;
                                                    return (
                                                        <>
                                                            <button
                                                                className="btn-icon"
                                                                onClick={() => !isLocked && handleUnpost(s.id)}
                                                                title={isLocked ? "Terkunci (Sudah ada Tagihan)" : "Unpost"}
                                                                style={{ color: isLocked ? '#ccc' : 'orange', marginRight: '5px', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                                                                disabled={isLocked}
                                                            >
                                                                🔓
                                                            </button>
                                                            <button className="btn-icon" onClick={() => handleEdit(s.id)} title="Lihat Detail" style={{ color: 'blue' }}>👁️</button>
                                                        </>
                                                    );
                                                })()
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

export default ShipmentList;
