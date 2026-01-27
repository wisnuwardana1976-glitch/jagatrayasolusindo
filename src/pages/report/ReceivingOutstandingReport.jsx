import { useState, useEffect } from 'react';

function ReceivingOutstandingReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/reports/receiving-outstanding');
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
        (item.partner_name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (item.po_number || '').toLowerCase().includes(filter.toLowerCase())
    );

    const totalAmount = filteredData.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

    return (
        <div className="report-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Laporan Receiving Outstanding</h1>
                    <p className="text-subtitle">Daftar Receiving yang belum dibuatkan AP Invoice</p>
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
                        placeholder="Cari No. Receiving, Supplier, atau PO..."
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
                                    <th>No. Receiving</th>
                                    <th>Tanggal</th>
                                    <th>No. PO</th>
                                    <th>Supplier</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                            Tidak ada Receiving yang outstanding
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={index}>
                                            <td><strong>{item.doc_number}</strong></td>
                                            <td>{formatDate(item.doc_date)}</td>
                                            <td>{item.po_number || '-'}</td>
                                            <td>{item.partner_name}</td>
                                            <td>
                                                <span className="status-badge status-approved">{item.status}</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.total_amount)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {filteredData.length > 0 && (
                                <tfoot>
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                        <td colSpan="5" style={{ textAlign: 'right' }}>Total Outstanding:</td>
                                        <td style={{ textAlign: 'right', color: '#d32f2f' }}>{formatCurrency(totalAmount)}</td>
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

export default ReceivingOutstandingReport;
