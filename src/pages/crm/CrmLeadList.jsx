import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

function CrmLeadList() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();

    const initialFormData = {
        company_name: '', contact_name: '', phone: '', email: '',
        address: '', city: '', source: '', status: 'New', assigned_to: '', notes: ''
    };
    const [formData, setFormData] = useState(initialFormData);

    const statusOptions = ['New', 'Contacted', 'Qualified', 'Lost'];
    const sourceOptions = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Exhibition', 'Advertisement', 'Other'];
    const statusColors = { New: '#3182ce', Contacted: '#d69e2e', Qualified: '#38a169', Lost: '#e53e3e' };

    useEffect(() => { fetchData(); }, [filterStatus]);

    const getToken = () => localStorage.getItem('token');

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/crm/leads?';
            if (filterStatus) url += `status=${filterStatus}&`;
            if (searchTerm) url += `search=${searchTerm}&`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) setLeads(data.data);
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    };

    const handleSearch = () => { fetchData(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/crm/leads/${editingItem.id}` : '/api/crm/leads';
            const method = editingItem ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) { alert(data.message); setShowForm(false); setEditingItem(null); setFormData(initialFormData); fetchData(); }
            else alert('Error: ' + data.error);
        } catch (error) { alert('Error: ' + error.message); }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            company_name: item.company_name || '', contact_name: item.contact_name || '',
            phone: item.phone || '', email: item.email || '', address: item.address || '',
            city: item.city || '', source: item.source || '', status: item.status || 'New',
            assigned_to: item.assigned_to || '', notes: item.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Lead ini?')) return;
        try {
            const response = await fetch(`/api/crm/leads/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) { alert(data.message); fetchData(); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const handleConvert = async (id) => {
        if (!confirm('Konversi Lead ini menjadi Opportunity?')) return;
        try {
            const response = await fetch(`/api/crm/leads/${id}/convert`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (data.success) { alert(data.message + ' (' + data.opp_no + ')'); fetchData(); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🎯 CRM - Lead Management</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingItem(null); setFormData(initialFormData); }}>
                    + Tambah Lead
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <input type="text" placeholder="Cari perusahaan, kontak, email..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                        <option value="">Semua Status</option>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-outline" onClick={handleSearch}>🔍 Cari</button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {statusOptions.map(s => (
                    <div key={s} style={{ background: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${statusColors[s]}` }}>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{s}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: statusColors[s] }}>{leads.filter(l => l.status === s).length}</div>
                    </div>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Lead' : 'Tambah Lead Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingItem(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Nama Perusahaan *</label>
                                    <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Nama Kontak</label>
                                    <input type="text" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Telepon</label>
                                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Kota</label>
                                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Sumber</label>
                                    <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })}>
                                        <option value="">-- Pilih --</option>
                                        {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Assigned To</label>
                                    <input type="text" value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Alamat</label>
                                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                            </div>
                            <div className="form-group">
                                <label>Catatan</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
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
                    <div className="loading"><div className="loading-spinner"></div><p>Memuat data...</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No. Lead</th>
                                <th>Perusahaan</th>
                                <th>Kontak</th>
                                <th>Telepon</th>
                                <th>Kota</th>
                                <th>Sumber</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data Lead</td></tr>
                            ) : (
                                leads.map((item) => (
                                    <tr key={item.id}>
                                        <td><strong>{item.lead_no}</strong></td>
                                        <td>{item.company_name}</td>
                                        <td>{item.contact_name}</td>
                                        <td>{item.phone}</td>
                                        <td>{item.city}</td>
                                        <td>{item.source}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                                                backgroundColor: `${statusColors[item.status]}20`, color: statusColors[item.status]
                                            }}>{item.status}</span>
                                        </td>
                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            <button className="btn-icon" onClick={() => handleEdit(item)} title="Edit">✏️</button>
                                            {item.status !== 'Qualified' && (
                                                <button className="btn-icon" onClick={() => handleConvert(item.id)} title="Konversi ke Opportunity" style={{ color: '#38a169' }}>🔄</button>
                                            )}
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

export default CrmLeadList;
