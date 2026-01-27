import { useState, useEffect } from 'react';

function ARAgingReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [viewMode, setViewMode] = useState('detail'); // 'detail' or 'summary'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/reports/ar-aging');
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            } else {
                alert('Error fetching report: ' + result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error fetching report');
        }
        setLoading(false);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
    };

    const filteredData = data.filter(item =>
        (item.doc_number || '').toLowerCase().includes(filter.toLowerCase()) ||
        (item.partner_name || '').toLowerCase().includes(filter.toLowerCase())
    );

    // Calculate totals
    const totals = filteredData.reduce((acc, item) => ({
        current: acc.current + (item.current || 0),
        days1_30: acc.days1_30 + (item.days1_30 || 0),
        days31_60: acc.days31_60 + (item.days31_60 || 0),
        days61_90: acc.days61_90 + (item.days61_90 || 0),
        days90plus: acc.days90plus + (item.days90plus || 0),
        total: acc.total + (Number(item.total_amount) || 0)
    }), { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 0 });

    // Group by partner for summary view
    const getSummaryData = () => {
        const partnerMap = {};
        filteredData.forEach(item => {
            const key = item.partner_id || 'unknown';
            if (!partnerMap[key]) {
                partnerMap[key] = {
                    partner_name: item.partner_name || 'Unknown',
                    current: 0,
                    days1_30: 0,
                    days31_60: 0,
                    days61_90: 0,
                    days90plus: 0,
                    total: 0
                };
            }
            partnerMap[key].current += item.current || 0;
            partnerMap[key].days1_30 += item.days1_30 || 0;
            partnerMap[key].days31_60 += item.days31_60 || 0;
            partnerMap[key].days61_90 += item.days61_90 || 0;
            partnerMap[key].days90plus += item.days90plus || 0;
            partnerMap[key].total += Number(item.total_amount) || 0;
        });
        return Object.values(partnerMap);
    };

    return (
        <div className="report-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Laporan AR Aging (Umur Piutang)</h1>
                    <p className="text-subtitle">Analisis umur piutang berdasarkan jatuh tempo</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        style={{ padding: '0.5rem' }}
                    >
                        <option value="detail">Detail per Invoice</option>
                        <option value="summary">Summary per Customer</option>
                    </select>
                    <button className="btn btn-outline" onClick={() => window.print()}>
                        🖨️ Cetak
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Cari No. Invoice atau Customer..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem' }}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Current</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#388e3c' }}>{formatCurrency(totals.current)}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>1-30 Hari</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f57c00' }}>{formatCurrency(totals.days1_30)}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>31-60 Hari</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e64a19' }}>{formatCurrency(totals.days31_60)}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>61-90 Hari</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#c62828' }}>{formatCurrency(totals.days61_90)}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>&gt;90 Hari</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#b71c1c' }}>{formatCurrency(totals.days90plus)}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#2e7d32', color: 'white' }}>
                    <div style={{ fontSize: '0.8rem' }}>Total Piutang</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(totals.total)}</div>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Memuat data...</p>
                    </div>
                ) : viewMode === 'detail' ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No. Invoice</th>
                                <th>Tanggal</th>
                                <th>Jatuh Tempo</th>
                                <th>Customer</th>
                                <th style={{ textAlign: 'right' }}>Current</th>
                                <th style={{ textAlign: 'right' }}>1-30</th>
                                <th style={{ textAlign: 'right' }}>31-60</th>
                                <th style={{ textAlign: 'right' }}>61-90</th>
                                <th style={{ textAlign: 'right' }}>&gt;90</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Tidak ada data AR Aging
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={index}>
                                        <td><strong>{item.doc_number}</strong></td>
                                        <td>{formatDate(item.doc_date)}</td>
                                        <td>{formatDate(item.due_date)}</td>
                                        <td>{item.partner_name}</td>
                                        <td style={{ textAlign: 'right', color: item.current > 0 ? '#388e3c' : '' }}>{item.current > 0 ? formatCurrency(item.current) : '-'}</td>
                                        <td style={{ textAlign: 'right', color: item.days1_30 > 0 ? '#f57c00' : '' }}>{item.days1_30 > 0 ? formatCurrency(item.days1_30) : '-'}</td>
                                        <td style={{ textAlign: 'right', color: item.days31_60 > 0 ? '#e64a19' : '' }}>{item.days31_60 > 0 ? formatCurrency(item.days31_60) : '-'}</td>
                                        <td style={{ textAlign: 'right', color: item.days61_90 > 0 ? '#c62828' : '' }}>{item.days61_90 > 0 ? formatCurrency(item.days61_90) : '-'}</td>
                                        <td style={{ textAlign: 'right', color: item.days90plus > 0 ? '#b71c1c' : '' }}>{item.days90plus > 0 ? formatCurrency(item.days90plus) : '-'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.total_amount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th style={{ textAlign: 'right' }}>Current</th>
                                <th style={{ textAlign: 'right' }}>1-30</th>
                                <th style={{ textAlign: 'right' }}>31-60</th>
                                <th style={{ textAlign: 'right' }}>61-90</th>
                                <th style={{ textAlign: 'right' }}>&gt;90</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getSummaryData().length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Tidak ada data AR Aging
                                    </td>
                                </tr>
                            ) : (
                                getSummaryData().map((item, index) => (
                                    <tr key={index}>
                                        <td><strong>{item.partner_name}</strong></td>
                                        <td style={{ textAlign: 'right', color: item.current > 0 ? '#388e3c' : '' }}>{item.current > 0 ? formatCurrency(item.current) : '-'}</td>
                                        <td style={{ textAlign: 'right', color: item.days1_30 > 0 ? '#f57c00' : '' }}>{item.days1_30 > 0 ? formatCurrency(item.days1_30) : '-'}</td>
                                        <td style={{ textAlign: 'right', color: item.days31_60 > 0 ? '#e64a19' : '' }}>{item.days31_60 > 0 ? formatCurrency(item.days31_60) : '-'}</td>
                                        <td style={{ textAlign: 'right', color: item.days61_90 > 0 ? '#c62828' : '' }}>{item.days61_90 > 0 ? formatCurrency(item.days61_90) : '-'}</td>
                                        <td style={{ textAlign: 'right', color: item.days90plus > 0 ? '#b71c1c' : '' }}>{item.days90plus > 0 ? formatCurrency(item.days90plus) : '-'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.total)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                <td>TOTAL</td>
                                <td style={{ textAlign: 'right', color: '#388e3c' }}>{formatCurrency(totals.current)}</td>
                                <td style={{ textAlign: 'right', color: '#f57c00' }}>{formatCurrency(totals.days1_30)}</td>
                                <td style={{ textAlign: 'right', color: '#e64a19' }}>{formatCurrency(totals.days31_60)}</td>
                                <td style={{ textAlign: 'right', color: '#c62828' }}>{formatCurrency(totals.days61_90)}</td>
                                <td style={{ textAlign: 'right', color: '#b71c1c' }}>{formatCurrency(totals.days90plus)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(totals.total)}</td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
}

export default ARAgingReport;
