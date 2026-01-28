import { useState, useEffect } from 'react';

import { usePeriod } from '../../context/PeriodContext';

function ReceivingList() {
    const { selectedPeriod } = usePeriod();
    const [receivings, setReceivings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Master Data
    const [suppliers, setSuppliers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [items, setItems] = useState([]);
    const [transcodes, setTranscodes] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);

    const [formData, setFormData] = useState({
        doc_number: '',
        doc_date: new Date().toISOString().split('T')[0],
        po_id: '',
        partner_id: '',
        location_id: '',
        status: 'Draft',
        transcode_id: '',
        remarks: '',
        items: []
    });

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, [selectedPeriod]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/receivings';
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
            if (data.success) setReceivings(data.data);
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const fetchMasterData = async () => {
        try {
            const [suppRes, whRes, itemRes, transRes, poRes] = await Promise.all([
                fetch('/api/partners?type=Supplier'),
                fetch('/api/locations'),
                fetch('/api/items'),
                fetch('/api/transcodes'),
                fetch('/api/purchase-orders') // Ideally filter for status Approved
            ]);

            const suppData = await suppRes.json();
            const whData = await whRes.json();
            const itemData = await itemRes.json();
            const transData = await transRes.json();
            const poData = await poRes.json();

            if (suppData.success) setSuppliers(suppData.data);
            if (suppData.success) setSuppliers(suppData.data);
            if (whData.success) setLocations(whData.data);
            if (itemData.success) setItems(itemData.data);
            if (transData.success) {
                // Filter for Receiving transcode (nomortranscode = 3)
                setTranscodes(transData.data.filter(t => t.active === 'Y' && t.nomortranscode === 3));
            }
            if (poData.success) {
                // Store all POs, filter in render
                setPurchaseOrders(poData.data);
            }

        } catch (error) {
            console.error('Error fetching master data:', error);
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

    const handleSelectPO = async (poId) => {
        if (!poId) {
            setFormData(prev => ({ ...prev, po_id: '', partner_id: '', items: [] }));
            return;
        }

        try {
            const response = await fetch(`/api/purchase-orders/${poId}`);
            const data = await response.json();
            if (data.success) {
                const po = data.data;
                const poDetails = po.details || [];

                setFormData(prev => ({
                    ...prev,
                    po_id: po.id,
                    partner_id: po.partner_id,
                    // Map PO items to Receiving items
                    items: poDetails.map(d => {
                        const ordered = parseFloat(d.quantity);
                        const received = parseFloat(d.qty_received || 0);
                        const outstanding = Math.max(0, ordered - received);
                        return {
                            item_id: d.item_id,
                            quantity: outstanding,
                            remarks: ''
                        };
                    })
                }));
            }
        } catch (error) {
            console.error('Error fetching PO details:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/receivings/${editingItem}` : '/api/receivings';
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
        console.log('Edit clicked for ID:', id);
        try {
            const response = await fetch(`/api/receivings/${id}`);
            const data = await response.json();
            if (data.success) {
                const rec = data.data;
                setFormData({
                    doc_number: rec.doc_number,
                    doc_date: new Date(rec.doc_date).toISOString().split('T')[0],
                    po_id: rec.po_id || '',
                    partner_id: rec.partner_id || '',
                    location_id: rec.location_id || '',
                    status: rec.status,
                    transcode_id: rec.transcode_id || '',
                    remarks: rec.remarks || '',
                    items: rec.details.map(d => ({
                        item_id: d.item_id,
                        quantity: parseFloat(d.quantity),
                        remarks: d.remarks || ''
                    }))
                });
                setEditingItem(id);
                setShowForm(true);
            } else {
                console.error('Failed to fetch details:', data.message || data.error);
                alert('Gagal mengambil detail: ' + (data.message || data.error));
            }
        } catch (error) {
            console.error('Error in handleEdit:', error);
            alert('Error fetching details: ' + error.message);
        }
    };

    const handlePost = async (id) => {
        if (!confirm('Post Receiving ini? Jurnal otomatis akan terbentuk.')) return;
        try {
            const response = await fetch(`/api/receivings/${id}/approve`, { method: 'PUT' });
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

    const handleUnpost = async (id) => {
        if (!confirm('Unpost Receiving ini? Jurnal otomatis akan dihapus.')) return;
        try {
            const response = await fetch(`/api/receivings/${id}/unapprove`, { method: 'PUT' });
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

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Receiving ini?')) return;
        try {
            const response = await fetch(`/api/receivings/${id}`, { method: 'DELETE' });
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

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            doc_number: '',
            doc_date: new Date().toISOString().split('T')[0],
            po_id: '',
            partner_id: '',
            location_id: '',
            status: 'Draft',
            transcode_id: '',
            remarks: '',
            items: []
        });
    };

    // Helper functions
    const updateItemLine = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const removeItemLine = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const addItemLine = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { item_id: '', quantity: 1, remarks: '' }]
        });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
    const formatDate = (date) => new Date(date).toLocaleDateString('id-ID');

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Receiving</h1>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                    + Buat Receiving Baru
                </button>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <div className="modal-header">
                            <h3>
                                {editingItem ? (formData.status !== 'Draft' ? 'Detail Receiving' : 'Edit Receiving') : 'Buat Receiving Baru'}
                                {formData.status !== 'Draft' && <span className="badge badge-success" style={{ marginLeft: '10px' }}>{formData.status} - Read Only</span>}
                            </h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tipe Transaksi</label>
                                    <select
                                        value={formData.transcode_id}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setFormData({ ...formData, transcode_id: val });
                                            const tc = transcodes.find(t => t.id === val);
                                            if (tc) generateNumber(tc.code);
                                        }}
                                        disabled={formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Tipe --</option>
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
                                        onChange={e => setFormData({ ...formData, doc_date: e.target.value })}
                                        disabled={formData.status !== 'Draft'}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ambil dari PO (Opsional)</label>
                                    <select
                                        value={formData.po_id}
                                        onChange={(e) => handleSelectPO(e.target.value)}
                                        disabled={!!editingItem || formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Manual (Tanpa PO) --</option>
                                        {purchaseOrders
                                            .filter(po => po.status === 'Approved' || (formData.po_id && po.id === parseInt(formData.po_id)))
                                            .map(po => (
                                                <option key={po.id} value={po.id}>{po.doc_number} - {po.partner_name}</option>
                                            ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Kirim Ke Location</label>
                                    <select
                                        value={formData.location_id}
                                        onChange={e => setFormData({ ...formData, location_id: e.target.value })}
                                        required
                                        disabled={formData.status !== 'Draft'}
                                    >
                                        <option value="">-- Pilih Location --</option>
                                        {locations.map(l => (
                                            <option key={l.id} value={l.id}>{l.code} - {l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Supplier</label>
                                    <select
                                        value={formData.partner_id}
                                        onChange={e => setFormData({ ...formData, partner_id: e.target.value })}
                                        disabled={!!formData.po_id || formData.status !== 'Draft'}
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
                                    value={formData.remarks}
                                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                    rows="2"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    disabled={formData.status !== 'Draft'}
                                />
                            </div>

                            <div className="form-section">
                                <div className="form-section-header">
                                    <h4>Daftar Barang</h4>
                                    {formData.status === 'Draft' && (
                                        <button type="button" className="btn btn-outline" onClick={addItemLine}>+ Tambah Manual</button>
                                    )}
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th style={{ width: '120px' }}>Qty Terima</th>
                                            <th>Keterangan</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.length === 0 ? (
                                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>{formData.status !== 'Draft' ? 'Tidak ada item' : 'Belum ada item'}</td></tr>
                                        ) : (
                                            formData.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <select
                                                            value={item.item_id}
                                                            onChange={e => updateItemLine(idx, 'item_id', e.target.value)}
                                                            disabled={!!formData.po_id || formData.status !== 'Draft'}
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
                                                                value={item.quantity}
                                                                onChange={e => updateItemLine(idx, 'quantity', parseFloat(e.target.value))}
                                                                min="0"
                                                                disabled={formData.status !== 'Draft'}
                                                                style={{ width: '80px' }}
                                                            />
                                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                                                {items.find(i => i.id === parseInt(item.item_id))?.unit || '-'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={item.remarks}
                                                            onChange={e => updateItemLine(idx, 'remarks', e.target.value)}
                                                            placeholder="Catatan..."
                                                            disabled={formData.status !== 'Draft'}
                                                        />
                                                    </td>
                                                    <td>
                                                        {formData.status === 'Draft' && (
                                                            <button type="button" className="btn-icon" onClick={() => removeItemLine(idx)}>🗑️</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        {/* Optional footer if needed later */}
                                    </tfoot>
                                </table>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                                    {formData.status !== 'Draft' ? 'Tutup' : 'Batal'}
                                </button>
                                {formData.status === 'Draft' && (
                                    <button type="submit" className="btn btn-primary">Simpan Receiving</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                {loading ? (
                    <div className="loading"><div className="loading-spinner"></div><p>Memuat data...</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No. Dokumen</th>
                                <th>Tanggal</th>
                                <th>No. PO</th>
                                <th>Supplier</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receivings.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data Receiving</td></tr>
                            ) : (
                                receivings.map(rec => (
                                    <tr key={rec.id}>
                                        <td><strong>{rec.doc_number}</strong></td>
                                        <td>{formatDate(rec.doc_date)}</td>
                                        <td>{rec.po_number || '-'}</td>
                                        <td>{rec.partner_name || '-'}</td>
                                        <td>{rec.location_name || '-'}</td>
                                        <td>
                                            <span className={`badge ${rec.status === 'Draft' ? 'badge-warning' : 'badge-success'}`}>{rec.status}</span>
                                            {rec.status !== 'Draft' && (
                                                <div style={{ fontSize: '10px', color: 'gray' }}>
                                                    Rec: {parseFloat(rec.total_received || 0)} / Bill: {parseFloat(rec.total_billed || 0)}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {rec.status === 'Draft' ? (
                                                <>
                                                    <button className="btn-icon" onClick={() => handlePost(rec.id)} title="Post" style={{ color: 'green', marginRight: '5px' }}>📮</button>
                                                    <button className="btn-icon" onClick={() => handleEdit(rec.id)} title="Edit" style={{ marginRight: '5px' }}>✏️</button>
                                                    <button className="btn-icon" onClick={() => handleDelete(rec.id)} title="Hapus">🗑️</button>
                                                </>
                                            ) : (
                                                (() => {
                                                    const isLocked = parseFloat(rec.total_billed || 0) >= parseFloat(rec.total_received || 0) && parseFloat(rec.total_received || 0) > 0;
                                                    return (
                                                        <>
                                                            <button
                                                                className="btn-icon"
                                                                onClick={() => !isLocked && handleUnpost(rec.id)}
                                                                title={isLocked ? "Terkunci (Sudah ada Tagihan)" : "Unpost"}
                                                                style={{ color: isLocked ? '#ccc' : 'orange', marginRight: '5px', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                                                                disabled={isLocked}
                                                            >
                                                                🔓
                                                            </button>
                                                            <button className="btn-icon" onClick={() => handleEdit(rec.id)} title="Lihat Detail" style={{ color: 'blue' }}>👁️</button>
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
                )
                }
            </div >
        </div >
    );
}

export default ReceivingList;
