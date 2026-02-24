import { useState, useEffect } from 'react';

function FixedAssetDepreciationList() {
    const [depreciations, setDepreciations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    useEffect(() => { fetchDepreciations(); }, [filterYear, filterMonth]);

    const fetchDepreciations = async () => {
        setLoading(true);
        try {
            let url = '/api/fixed-asset-depreciations?';
            if (filterYear) url += `period_year=${filterYear}&`;
            if (filterMonth) url += `period_month=${filterMonth}&`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) setDepreciations(data.data);
        } catch (err) { console.error('Error:', err); }
        setLoading(false);
    };

    const handleRunDepreciation = async () => {
        if (!confirm(`Jalankan penyusutan untuk periode ${months[selectedMonth - 1]} ${selectedYear}?\n\nProses ini akan menghitung penyusutan untuk semua aset aktif.`)) return;
        setRunning(true);
        try {
            const res = await fetch('/api/fixed-assets/run-depreciation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year: selectedYear, month: selectedMonth })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                setFilterYear(String(selectedYear));
                setFilterMonth(String(selectedMonth));
                fetchDepreciations();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) { alert('Error: ' + err.message); }
        setRunning(false);
    };

    const formatCurrency = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID') : '-';

    const years = [];
    for (let y = new Date().getFullYear() - 5; y <= new Date().getFullYear() + 1; y++) years.push(y);

    // Totals
    const totalDep = depreciations.reduce((s, d) => s + parseFloat(d.depreciation_amount || 0), 0);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Penyusutan Aset Tetap</h1>
            </div>

            {/* Run Depreciation */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🔄 Jalankan Penyusutan Bulanan</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Bulan</label>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={{ minWidth: '140px' }}>
                            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Tahun</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ minWidth: '100px' }}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleRunDepreciation} disabled={running}
                        style={{ marginBottom: '0.5rem', backgroundColor: '#48bb78' }}>
                        {running ? '⏳ Memproses...' : '▶️ Jalankan Penyusutan'}
                    </button>
                </div>
                <p style={{ color: '#a0aec0', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                    Penyusutan akan dihitung untuk semua aset tetap yang berstatus Active. Setiap periode hanya bisa dijalankan satu kali.
                </p>
            </div>

            {/* Filter History */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Filter Tahun</label>
                    <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ minWidth: '100px' }}>
                        <option value="">Semua</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Filter Bulan</label>
                    <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ minWidth: '140px' }}>
                        <option value="">Semua</option>
                        {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                </div>
                <button className="btn btn-outline" onClick={() => { setFilterYear(''); setFilterMonth(''); }} style={{ marginBottom: '0.5rem' }}>Reset</button>
                {depreciations.length > 0 && (
                    <div style={{ marginLeft: 'auto', marginBottom: '0.5rem', fontWeight: 'bold', color: '#fc8181' }}>
                        Total Penyusutan: {formatCurrency(totalDep)}
                    </div>
                )}
            </div>

            {/* Depreciation History Table */}
            <div className="card">
                {loading ? (
                    <div className="loading"><div className="loading-spinner"></div><p>Memuat data...</p></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Periode</th>
                                <th>No. Aset</th>
                                <th>Nama Aset</th>
                                <th>Kategori</th>
                                <th style={{ textAlign: 'right' }}>Penyusutan</th>
                                <th style={{ textAlign: 'right' }}>Akumulasi</th>
                                <th style={{ textAlign: 'right' }}>Nilai Buku</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {depreciations.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada riwayat penyusutan</td></tr>
                            ) : depreciations.map(d => (
                                <tr key={d.id}>
                                    <td>{formatDate(d.period_date)}</td>
                                    <td><strong>{d.asset_no}</strong></td>
                                    <td>{d.asset_name}</td>
                                    <td><span className="badge badge-info">{d.category_name || '-'}</span></td>
                                    <td style={{ textAlign: 'right', color: '#fc8181' }}>{formatCurrency(d.depreciation_amount)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(d.accumulated_amount)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(d.book_value)}</td>
                                    <td style={{ textAlign: 'center' }}><span className="badge badge-success">{d.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default FixedAssetDepreciationList;
