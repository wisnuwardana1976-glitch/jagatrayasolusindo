import { useState, useEffect } from 'react';

function POOutstandingReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/reports/po-outstanding');
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
        return new Date(date).toLocaleDateString('id-ID');
    };

    const filteredData = data.filter(item =>
        item.doc_number.toLowerCase().includes(filter.toLowerCase()) ||
        item.partner_name.toLowerCase().includes(filter.toLowerCase()) ||
        item.item_name.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="report-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Laporan PO Outstanding</h1>
                    <p className="text-subtitle">Daftar barang PO yang belum diterima sepenuhnya</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-outline" onClick={() => window.print()}>
                        🖨️ Cetak
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate('/')}>
                        Kembali
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Cari PO, Supplier, atau Barang..."
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
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No. PO</th>
                                <th>Tanggal</th>
                                <th>Supplier</th>
                                <th>Kode Barang</th>
                                <th>Nama Barang</th>
                                <th style={{ textAlign: 'center' }}>Satuan</th>
                                <th style={{ textAlign: 'right' }}>Qty Pesan</th>
                                <th style={{ textAlign: 'right' }}>Qty Terima</th>
                                <th style={{ textAlign: 'right', color: 'red' }}>Sisa (Outstanding)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Tidak ada data outstanding PO
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={index}>
                                        <td><strong>{item.doc_number}</strong></td>
                                        <td>{formatDate(item.doc_date)}</td>
                                        <td>{item.partner_name}</td>
                                        <td>{item.item_code}</td>
                                        <td>{item.item_name}</td>
                                        <td style={{ textAlign: 'center' }}>{item.unit}</td>
                                        <td style={{ textAlign: 'right' }}>{item.qty_ordered}</td>
                                        <td style={{ textAlign: 'right' }}>{item.qty_received}</td>
                                        <td style={{ textAlign: 'right', color: 'red', fontWeight: 'bold' }}>
                                            {item.qty_outstanding}
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

export default POOutstandingReport;
