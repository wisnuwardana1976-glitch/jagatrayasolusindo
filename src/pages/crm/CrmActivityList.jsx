import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

function CrmActivityList() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();

    const initialFormData = {
        activity_type: 'Call', subject: '', description: '',
        activity_date: new Date().toISOString().substring(0, 16),
        due_date: '', lead_id: '', opportunity_id: '', customer_id: '',
        assigned_to: '', status: 'Planned', priority: 'Normal'
    };
    const [formData, setFormData] = useState(initialFormData);
    const [leads, setLeads] = useState([]);
    const [opportunities, setOpportunities] = useState([]);

    const typeOptions = ['Call', 'Meeting', 'Email', 'Visit', 'Task'];
    const statusOptions = ['Planned', 'Completed', 'Cancelled'];
    const priorityOptions = ['Low', 'Normal', 'High', 'Urgent'];
    const typeIcons = { Call: '📞', Meeting: '🤝', Email: '📧', Visit: '🏢', Task: '✅' };
    const statusColors = { Planned: '#3182ce', Completed: '#38a169', Cancelled: '#e53e3e' };
    const priorityColors = { Low: '#6b7280', Normal: '#3182ce', High: '#d69e2e', Urgent: '#e53e3e' };

    useEffect(() => { fetchData(); fetchLeads(); fetchOpportunities(); }, [filterType, filterStatus]);

    const getToken = () => localStorage.getItem('token');

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/crm/activities?';
            if (filterType) url += `activity_type=${filterType}&`;
            if (filterStatus) url += `status=${filterStatus}&`;
            if (searchTerm) url += `search=${searchTerm}&`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) setActivities(data.data);
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

    const fetchOpportunities = async () => {
        try {
            const response = await fetch('/api/crm/opportunities', { headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) setOpportunities(data.data);
        } catch (error) { console.error('Error:', error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/crm/activities/${editingItem.id}` : '/api/crm/activities';
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
            activity_type: item.activity_type || 'Call', subject: item.subject || '',
            description: item.description || '',
            activity_date: item.activity_date ? item.activity_date.substring(0, 16) : '',
            due_date: item.due_date ? item.due_date.substring(0, 16) : '',
            lead_id: item.lead_id || '', opportunity_id: item.opportunity_id || '',
            customer_id: item.customer_id || '', assigned_to: item.assigned_to || '',
            status: item.status || 'Planned', priority: item.priority || 'Normal'
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Activity ini?')) return;
        try {
            const response = await fetch(`/api/crm/activities/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) { alert(data.message); fetchData(); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const markComplete = async (item) => {
        try {
            const response = await fetch(`/api/crm/activities/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ ...item, status: 'Completed' })
            });
            const data = await response.json();
            if (data.success) fetchData();
        } catch (error) { alert('Error: ' + error.message); }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📅 CRM - Activity Log</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingItem(null); setFormData(initialFormData); }}>
                    + Tambah Activity
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
                {typeOptions.map(t => (
                    <div key={t} onClick={() => setFilterType(filterType === t ? '' : t)}
                        style={{ background: filterType === t ? '#edf2f7' : 'white', borderRadius: '8px', padding: '0.8rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer', textAlign: 'center', border: filterType === t ? '2px solid #3182ce' : '2px solid transparent', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '1.5rem' }}>{typeIcons[t]}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{t}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{activities.filter(a => a.activity_type === t).length}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="text" placeholder="Cari subjek, deskripsi..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                        style={{ flex: 1, minWidth: '200px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                        <option value="">Semua Status</option>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-outline" onClick={fetchData}>🔍 Cari</button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Activity' : 'Tambah Activity Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingItem(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Tipe Activity *</label>
                                    <select value={formData.activity_type} onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}>
                                        {typeOptions.map(t => <option key={t} value={t}>{typeIcons[t]} {t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Prioritas</label>
                                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                                        {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Subjek *</label>
                                    <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal & Waktu *</label>
                                    <input type="datetime-local" value={formData.activity_date} onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input type="datetime-local" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Lead Terkait</label>
                                    <select value={formData.lead_id} onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}>
                                        <option value="">-- Pilih --</option>
                                        {leads.map(l => <option key={l.id} value={l.id}>{l.company_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Opportunity Terkait</label>
                                    <select value={formData.opportunity_id} onChange={(e) => setFormData({ ...formData, opportunity_id: e.target.value })}>
                                        <option value="">-- Pilih --</option>
                                        {opportunities.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Assigned To</label>
                                    <input type="text" value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Deskripsi</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
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
                                <th>Tipe</th>
                                <th>Subjek</th>
                                <th>Tanggal</th>
                                <th>Lead/Opp</th>
                                <th>Assigned</th>
                                <th>Prioritas</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data Activity</td></tr>
                            ) : (
                                activities.map((item) => (
                                    <tr key={item.id} style={{ opacity: item.status === 'Completed' ? 0.7 : 1 }}>
                                        <td style={{ fontSize: '1.2rem', textAlign: 'center' }}>{typeIcons[item.activity_type] || '📋'}</td>
                                        <td>
                                            <strong>{item.subject}</strong>
                                            {item.description && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>{item.description.substring(0, 60)}...</div>}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{item.activity_date ? new Date(item.activity_date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{item.lead_name || item.opportunity_title || '-'}</td>
                                        <td>{item.assigned_to || '-'}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600',
                                                backgroundColor: `${priorityColors[item.priority]}20`, color: priorityColors[item.priority]
                                            }}>{item.priority}</span>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                                                backgroundColor: `${statusColors[item.status]}20`, color: statusColors[item.status]
                                            }}>{item.status}</span>
                                        </td>
                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            {item.status === 'Planned' && (
                                                <button className="btn-icon" onClick={() => markComplete(item)} title="Selesai" style={{ color: '#38a169' }}>✅</button>
                                            )}
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

export default CrmActivityList;
