import { useState, useEffect } from 'react';

function APOutstandingReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/reports/ap-outstanding');
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

    const totalAmount = filteredData.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

    return (
        <div className="report-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Laporan AP Outstanding (Hutang)</h1>
                    <p className="text-subtitle">Daftar AP Invoice (Hutang) yang belum dibayar</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-outline" onClick={() => window.print()}>
                        🖨️ Cetak
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Cari No. Invoice atau Supplier..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem' }}
                    />
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Memuat data...</p>
                    </div>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>No. Invoice</th>
                                    <th>Tanggal</th>
                                    <th>Jatuh Tempo</th>
                                    <th>Supplier</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                    <th style={{ textAlign: 'center' }}>Hari Lewat</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                            Tidak ada AP Invoice yang outstanding
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={index}>
                                            <td><strong>{item.doc_number}</strong></td>
                                            <td>{formatDate(item.doc_date)}</td>
                                            <td>{formatDate(item.due_date)}</td>
                                            <td>{item.partner_name}</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.total_amount)}</td>
                                            <td style={{ textAlign: 'center', color: item.days_overdue > 0 ? '#d32f2f' : '#388e3c', fontWeight: 'bold' }}>
                                                {item.days_overdue > 0 ? item.days_overdue + ' hari' : 'Belum jatuh tempo'}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${item.days_overdue > 0 ? 'status-draft' : 'status-approved'}`}>
                                                    {item.days_overdue > 0 ? 'Overdue' : 'Current'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {filteredData.length > 0 && (
                                <tfoot>
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                        <td colSpan="4" style={{ textAlign: 'right' }}>Total Hutang Outstanding:</td>
                                        <td style={{ textAlign: 'right', color: '#d32f2f' }}>{formatCurrency(totalAmount)}</td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </>
                )}
            </div>
        </div>
    );
}

export default APOutstandingReport;
