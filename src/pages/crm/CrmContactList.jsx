import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

function CrmContactList() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();

    const initialFormData = {
        contact_name: '', title: '', phone: '', mobile: '', email: '',
        department: '', lead_id: '', customer_id: '', is_primary: 'N', notes: '', active: 'Y'
    };
    const [formData, setFormData] = useState(initialFormData);
    const [leads, setLeads] = useState([]);
    const [customers, setCustomers] = useState([]);

    useEffect(() => { fetchData(); fetchLeads(); fetchCustomers(); }, []);

    const getToken = () => localStorage.getItem('token');

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/crm/contacts?';
            if (searchTerm) url += `search=${searchTerm}&`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) setContacts(data.data);
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    };

    const fetchLeads = async () => {
        try {
            const response = await fetch('/api/crm/leads', { headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) setLeads(data.data);
        } catch (error) { console.error('Error:', error); }
    };

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/partners?type=Customer');
            const data = await response.json();
            if (data.success) setCustomers(data.data);
        } catch (error) { console.error('Error:', error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/crm/contacts/${editingItem.id}` : '/api/crm/contacts';
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
            contact_name: item.contact_name || '', title: item.title || '',
            phone: item.phone || '', mobile: item.mobile || '', email: item.email || '',
            department: item.department || '', lead_id: item.lead_id || '',
            customer_id: item.customer_id || '', is_primary: item.is_primary || 'N',
            notes: item.notes || '', active: item.active || 'Y'
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Contact ini?')) return;
        try {
            const response = await fetch(`/api/crm/contacts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) { alert(data.message); fetchData(); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📇 CRM - Contact Management</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingItem(null); setFormData(initialFormData); }}>
                    + Tambah Contact
                </button>
            </div>

            {/* Search */}
            <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input type="text" placeholder="Cari nama, email, telepon..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                        style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                    <button className="btn btn-outline" onClick={fetchData}>🔍 Cari</button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Contact' : 'Tambah Contact Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingItem(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Nama Kontak *</label>
                                    <input type="text" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Jabatan</label>
                                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Direktur, Manager" />
                                </div>
                                <div className="form-group">
                                    <label>Telepon</label>
                                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Mobile/HP</label>
                                    <input type="text" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Departemen</label>
                                    <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Lead</label>
                                    <select value={formData.lead_id} onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}>
                                        <option value="">-- Pilih Lead --</option>
                                        {leads.map(l => <option key={l.id} value={l.id}>{l.company_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Customer</label>
                                    <select value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}>
                                        <option value="">-- Pilih Customer --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Kontak Utama?</label>
                                    <select value={formData.is_primary} onChange={(e) => setFormData({ ...formData, is_primary: e.target.value })}>
                                        <option value="N">Tidak</option>
                                        <option value="Y">Ya</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Aktif</label>
                                    <select value={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.value })}>
                                        <option value="Y">Ya</option>
                                        <option value="N">Tidak</option>
                                    </select>
                                </div>
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
                                <th>Nama</th>
                                <th>Jabatan</th>
                                <th>Telepon</th>
                                <th>Email</th>
                                <th>Departemen</th>
                                <th>Primary</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data Contact</td></tr>
                            ) : (
                                contacts.map((item) => (
                                    <tr key={item.id}>
                                        <td><strong>{item.contact_name}</strong></td>
                                        <td>{item.title}</td>
                                        <td>{item.phone || item.mobile}</td>
                                        <td>{item.email}</td>
                                        <td>{item.department}</td>
                                        <td>{item.is_primary === 'Y' ? '⭐' : '-'}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem',
                                                backgroundColor: item.active === 'Y' ? '#c6f6d520' : '#fed7d720',
                                                color: item.active === 'Y' ? '#38a169' : '#e53e3e'
                                            }}>{item.active === 'Y' ? 'Aktif' : 'Nonaktif'}</span>
                                        </td>
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

export default CrmContactList;
