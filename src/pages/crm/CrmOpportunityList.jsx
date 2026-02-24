import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

function CrmOpportunityList() {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [filterStage, setFilterStage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();

    const initialFormData = {
        lead_id: '', customer_id: '', title: '', estimated_value: 0, currency_code: 'IDR',
        probability: 0, stage: 'Prospecting', expected_close_date: '', assigned_to: '', notes: ''
    };
    const [formData, setFormData] = useState(initialFormData);
    const [leads, setLeads] = useState([]);

    const stageOptions = ['Prospecting', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    const stageColors = { Prospecting: '#3182ce', Proposal: '#d69e2e', Negotiation: '#805ad5', 'Closed Won': '#38a169', 'Closed Lost': '#e53e3e' };
    const probabilityByStage = { Prospecting: 20, Proposal: 50, Negotiation: 70, 'Closed Won': 100, 'Closed Lost': 0 };

    useEffect(() => { fetchData(); fetchLeads(); }, [filterStage]);

    const getToken = () => localStorage.getItem('token');

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/crm/opportunities?';
            if (filterStage) url += `stage=${filterStage}&`;
            if (searchTerm) url += `search=${searchTerm}&`;
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) setOpportunities(data.data);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/crm/opportunities/${editingItem.id}` : '/api/crm/opportunities';
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
            lead_id: item.lead_id || '', customer_id: item.customer_id || '', title: item.title || '',
            estimated_value: item.estimated_value || 0, currency_code: item.currency_code || 'IDR',
            probability: item.probability || 0, stage: item.stage || 'Prospecting',
            expected_close_date: item.expected_close_date ? item.expected_close_date.substring(0, 10) : '',
            assigned_to: item.assigned_to || '', notes: item.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus Opportunity ini?')) return;
        try {
            const response = await fetch(`/api/crm/opportunities/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) { alert(data.message); fetchData(); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID').format(val || 0);

    // Pipeline Summary
    const pipelineTotal = opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage)).reduce((sum, o) => sum + parseFloat(o.estimated_value || 0), 0);
    const wonTotal = opportunities.filter(o => o.stage === 'Closed Won').reduce((sum, o) => sum + parseFloat(o.estimated_value || 0), 0);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📊 CRM - Opportunity Pipeline</h1>
                <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingItem(null); setFormData(initialFormData); }}>
                    + Tambah Opportunity
                </button>
            </div>

            {/* Pipeline Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '1.2rem', color: 'white', boxShadow: '0 4px 15px rgba(102,126,234,0.4)' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Pipeline</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>Rp {formatCurrency(pipelineTotal)}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage)).length} opportunity</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)', borderRadius: '12px', padding: '1.2rem', color: 'white', boxShadow: '0 4px 15px rgba(56,161,105,0.4)' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Won</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>Rp {formatCurrency(wonTotal)}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{opportunities.filter(o => o.stage === 'Closed Won').length} opportunity</div>
                </div>
                {stageOptions.filter(s => !['Closed Won', 'Closed Lost'].includes(s)).map(s => (
                    <div key={s} style={{ background: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${stageColors[s]}` }}>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{s}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: stageColors[s] }}>{opportunities.filter(o => o.stage === s).length}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="text" placeholder="Cari judul, nomor..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                        style={{ flex: 1, minWidth: '200px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                    <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                        <option value="">Semua Stage</option>
                        {stageOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-outline" onClick={fetchData}>🔍 Cari</button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Opportunity' : 'Tambah Opportunity Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingItem(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Judul Opportunity *</label>
                                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Lead Terkait</label>
                                    <select value={formData.lead_id} onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}>
                                        <option value="">-- Pilih Lead --</option>
                                        {leads.map(l => <option key={l.id} value={l.id}>{l.company_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Stage</label>
                                    <select value={formData.stage} onChange={(e) => {
                                        const newStage = e.target.value;
                                        setFormData({ ...formData, stage: newStage, probability: probabilityByStage[newStage] || 0 });
                                    }}>
                                        {stageOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Estimasi Nilai</label>
                                    <input type="number" value={formData.estimated_value} onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Probabilitas (%)</label>
                                    <input type="number" min="0" max="100" value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal Target Close</label>
                                    <input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Assigned To</label>
                                    <input type="text" value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} />
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
                                <th>No. Opp</th>
                                <th>Judul</th>
                                <th>Lead</th>
                                <th>Estimasi Nilai</th>
                                <th>Probabilitas</th>
                                <th>Stage</th>
                                <th>Target Close</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {opportunities.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data Opportunity</td></tr>
                            ) : (
                                opportunities.map((item) => (
                                    <tr key={item.id}>
                                        <td><strong>{item.opp_no}</strong></td>
                                        <td>{item.title}</td>
                                        <td>{item.lead_name || '-'}</td>
                                        <td style={{ textAlign: 'right' }}>Rp {formatCurrency(item.estimated_value)}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px' }}>
                                                    <div style={{ width: `${item.probability}%`, backgroundColor: stageColors[item.stage], borderRadius: '4px', height: '100%', transition: 'width 0.3s' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.8rem' }}>{item.probability}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                                                backgroundColor: `${stageColors[item.stage]}20`, color: stageColors[item.stage]
                                            }}>{item.stage}</span>
                                        </td>
                                        <td>{item.expected_close_date ? new Date(item.expected_close_date).toLocaleDateString('id-ID') : '-'}</td>
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

export default CrmOpportunityList;
