import { useState, useEffect } from 'react';

function FixedAssetReport() {
    const [reportData, setReportData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => { fetchCategories(); }, []);
    useEffect(() => { fetchReport(); }, [filterCategory, filterStatus]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/fixed-asset-categories');
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } catch (err) { console.error('Error:', err); }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = '/api/fixed-assets/report/summary?';
            if (filterCategory) url += `category_id=${filterCategory}&`;
            if (filterStatus) url += `status=${filterStatus}&`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) setReportData(data.data);
        } catch (err) { console.error('Error:', err); }
        setLoading(false);
    };

    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID') : '-';

    const statusBadge = (status) => {
        const map = { Active: 'badge-success', Disposed: 'badge-danger', Sold: 'badge-warning', 'Fully Depreciated': 'badge-info' };
        return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Laporan Aset Tetap</h1>
            </div>

            {/* Summary Cards */}
            {reportData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Total Aset</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#63b3ed' }}>{reportData.totals.totalAssets}</div>
                    </div>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Total Nilai Perolehan</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#68d391' }}>{formatCurrency(reportData.totals.totalCost)}</div>
                    </div>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Total Akumulasi</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fc8181' }}>{formatCurrency(reportData.totals.totalAccumulated)}</div>
                    </div>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Total Nilai Buku</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f6ad55' }}>{formatCurrency(reportData.totals.totalBookValue)}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Kategori</label>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ minWidth: '150px' }}>
                        <option value="">Semua Kategori</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: '130px' }}>
                        <option value="">Semua Status</option>
                        <option value="Active">Active</option>
                        <option value="Disposed">Disposed</option>
                        <option value="Sold">Sold</option>
                        <option value="Fully Depreciated">Fully Depreciated</option>
                    </select>
                </div>
                <button className="btn btn-outline" onClick={() => { setFilterCategory(''); setFilterStatus(''); }} style={{ marginBottom: '0.5rem' }}>Reset</button>
            </div>

            {loading ? (
                <div className="card"><div className="loading"><div className="loading-spinner"></div><p>Memuat laporan...</p></div></div>
            ) : reportData && (
                <>
                    {/* Category Summary */}
                    {reportData.categorySummary.length > 0 && (
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ padding: '1rem 1rem 0.5rem', fontSize: '1rem' }}>📊 Ringkasan per Kategori</h3>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Kategori</th>
                                        <th style={{ textAlign: 'center' }}>Jumlah Aset</th>
                                        <th style={{ textAlign: 'right' }}>Nilai Perolehan</th>
                                        <th style={{ textAlign: 'right' }}>Akumulasi Penyusutan</th>
                                        <th style={{ textAlign: 'right' }}>Nilai Buku</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.categorySummary.map((cs, i) => (
                                        <tr key={i}>
                                            <td><strong>{cs.category}</strong></td>
                                            <td style={{ textAlign: 'center' }}>{cs.count}</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(cs.total_cost)}</td>
                                            <td style={{ textAlign: 'right', color: '#fc8181' }}>{formatCurrency(cs.total_accumulated)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(cs.total_book_value)}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ fontWeight: 'bold', backgroundColor: 'rgba(74,85,104,0.3)' }}>
                                        <td>TOTAL</td>
                                        <td style={{ textAlign: 'center' }}>{reportData.totals.totalAssets}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(reportData.totals.totalCost)}</td>
                                        <td style={{ textAlign: 'right', color: '#fc8181' }}>{formatCurrency(reportData.totals.totalAccumulated)}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(reportData.totals.totalBookValue)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Detail List */}
                    <div className="card">
                        <h3 style={{ padding: '1rem 1rem 0.5rem', fontSize: '1rem' }}>📋 Detail Aset Tetap</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>No. Aset</th>
                                    <th>Nama</th>
                                    <th>Kategori</th>
                                    <th>Tgl Perolehan</th>
                                    <th style={{ textAlign: 'right' }}>Harga Perolehan</th>
                                    <th style={{ textAlign: 'right' }}>Akumulasi</th>
                                    <th style={{ textAlign: 'right' }}>Nilai Buku</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.assets.length === 0 ? (
                                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada data</td></tr>
                                ) : reportData.assets.map(a => (
                                    <tr key={a.id}>
                                        <td><strong>{a.asset_no}</strong></td>
                                        <td>{a.name}</td>
                                        <td><span className="badge badge-info">{a.category_name || '-'}</span></td>
                                        <td>{formatDate(a.acquisition_date)}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(a.acquisition_cost)}</td>
                                        <td style={{ textAlign: 'right', color: '#fc8181' }}>{formatCurrency(a.accumulated_depreciation)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(a.book_value)}</td>
                                        <td style={{ textAlign: 'center' }}>{statusBadge(a.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default FixedAssetReport;
