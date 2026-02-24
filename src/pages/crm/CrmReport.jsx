import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

function CrmReport() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => { fetchDashboard(); }, []);

    const getToken = () => localStorage.getItem('token');

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/crm/dashboard', { headers: { 'Authorization': `Bearer ${getToken()}` } });
            const data = await response.json();
            if (data.success) setDashboardData(data.data);
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID').format(val || 0);

    const stageColors = { Prospecting: '#3182ce', Proposal: '#d69e2e', Negotiation: '#805ad5', 'Closed Won': '#38a169', 'Closed Lost': '#e53e3e' };
    const statusColors = { New: '#3182ce', Contacted: '#d69e2e', Qualified: '#38a169', Lost: '#e53e3e' };
    const quotStatusColors = { Draft: '#6b7280', Sent: '#3182ce', Accepted: '#38a169', Rejected: '#e53e3e' };

    if (loading) return <div className="loading"><div className="loading-spinner"></div><p>Memuat dashboard CRM...</p></div>;
    if (!dashboardData) return <div>Tidak bisa memuat data.</div>;

    const { summary, leadsByStatus, oppsByStage, quotsByStatus, recentActivities } = dashboardData;

    // Calculate max values for bar charts
    const maxOppCount = Math.max(...(oppsByStage.map(o => o.count) || [1]), 1);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📈 CRM Dashboard & Report</h1>
                <button className="btn btn-outline" onClick={fetchDashboard}>🔄 Refresh</button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '1.5rem', color: 'white', boxShadow: '0 4px 15px rgba(102,126,234,0.4)' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>🎯 Total Leads</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{summary.totalLeads}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: '1.5rem', color: 'white', boxShadow: '0 4px 15px rgba(245,87,108,0.4)' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>📊 Total Opportunities</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{summary.totalOpportunities}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', padding: '1.5rem', color: 'white', boxShadow: '0 4px 15px rgba(79,172,254,0.4)' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>📋 Total Quotations</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{summary.totalQuotations}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '12px', padding: '1.5rem', color: 'white', boxShadow: '0 4px 15px rgba(67,233,123,0.4)' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>💰 Pipeline Value</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Rp {formatCurrency(summary.pipelineValue)}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)', borderRadius: '12px', padding: '1.5rem', color: 'white', boxShadow: '0 4px 15px rgba(56,161,105,0.4)' }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>🏆 Won Value</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Rp {formatCurrency(summary.wonValue)}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Lead Status */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1a202c' }}>Lead berdasarkan Status</h3>
                    {leadsByStatus.length === 0 ? (
                        <p style={{ color: '#6b7280', textAlign: 'center' }}>Belum ada data</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {leadsByStatus.map((item, idx) => (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColors[item.status] || '#6b7280', marginRight: '0.5rem' }}></span>
                                            {item.status}
                                        </span>
                                        <span style={{ fontWeight: 'bold' }}>{item.count}</span>
                                    </div>
                                    <div style={{ backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px' }}>
                                        <div style={{ width: `${(item.count / summary.totalLeads) * 100}%`, backgroundColor: statusColors[item.status] || '#6b7280', borderRadius: '4px', height: '100%', transition: 'width 0.5s' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Opportunity Pipeline */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1a202c' }}>Opportunity Pipeline</h3>
                    {oppsByStage.length === 0 ? (
                        <p style={{ color: '#6b7280', textAlign: 'center' }}>Belum ada data</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {oppsByStage.map((item, idx) => (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: stageColors[item.stage] || '#6b7280', marginRight: '0.5rem' }}></span>
                                            {item.stage}
                                        </span>
                                        <span style={{ fontSize: '0.85rem' }}><strong>{item.count}</strong> · Rp {formatCurrency(item.total_value)}</span>
                                    </div>
                                    <div style={{ backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px' }}>
                                        <div style={{ width: `${(item.count / maxOppCount) * 100}%`, backgroundColor: stageColors[item.stage] || '#6b7280', borderRadius: '4px', height: '100%', transition: 'width 0.5s' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Quotation Status */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1a202c' }}>Quotation berdasarkan Status</h3>
                    {quotsByStatus.length === 0 ? (
                        <p style={{ color: '#6b7280', textAlign: 'center' }}>Belum ada data</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {quotsByStatus.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                                            backgroundColor: `${quotStatusColors[item.status]}20`, color: quotStatusColors[item.status]
                                        }}>{item.status}</span>
                                        <span style={{ fontWeight: '600' }}>{item.count}</span>
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>Rp {formatCurrency(item.total_value)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activities */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1a202c' }}>Aktivitas Terakhir</h3>
                    {recentActivities.length === 0 ? (
                        <p style={{ color: '#6b7280', textAlign: 'center' }}>Belum ada aktivitas</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {recentActivities.map((act, idx) => {
                                const typeIcons = { Call: '📞', Meeting: '🤝', Email: '📧', Visit: '🏢', Task: '✅' };
                                return (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem', borderRadius: '6px', backgroundColor: '#f9fafb' }}>
                                        <span style={{ fontSize: '1.2rem' }}>{typeIcons[act.activity_type] || '📋'}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '500', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.subject}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                {act.lead_name && `Lead: ${act.lead_name}`}
                                                {' · '}
                                                {act.activity_date ? new Date(act.activity_date).toLocaleDateString('id-ID') : ''}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '0.15rem 0.4rem', borderRadius: '8px', fontSize: '0.7rem',
                                            backgroundColor: act.status === 'Completed' ? '#c6f6d520' : '#bee3f820',
                                            color: act.status === 'Completed' ? '#38a169' : '#3182ce'
                                        }}>{act.status}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CrmReport;
