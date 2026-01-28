
import { useState, useEffect } from 'react';
import { usePeriod } from '../../context/PeriodContext';

function BalanceSheetReport() {
    const { selectedPeriod } = usePeriod();
    const [accounts, setAccounts] = useState([]);
    const [netIncome, setNetIncome] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedPeriod]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/reports/balance-sheet';
            if (selectedPeriod) {
                const formatDate = (d) => new Date(d).toISOString().split('T')[0];
                const query = new URLSearchParams({
                    endDate: formatDate(selectedPeriod.end_date)
                }).toString();
                url += `?${query}`;
            }
            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setAccounts(result.data.accounts);
                setNetIncome(parseFloat(result.data.netIncome));
            }
        } catch (error) {
            console.error('Error fetching balance sheet:', error);
        }
        setLoading(false);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

    // Filter and Calculate
    const assets = accounts.filter(a => a.type === 'ASSET');
    const liabilities = accounts.filter(a => a.type === 'LIABILITY');
    const equities = accounts.filter(a => a.type === 'EQUITY');

    // Assets: Debit - Credit
    const totalAssets = assets.reduce((acc, curr) => acc + (parseFloat(curr.debit || 0) - parseFloat(curr.credit || 0)), 0);

    // Liabilities: Credit - Debit
    const totalLiabilities = liabilities.reduce((acc, curr) => acc + (parseFloat(curr.credit || 0) - parseFloat(curr.debit || 0)), 0);

    // Equity: Credit - Debit
    const totalEquityRaw = equities.reduce((acc, curr) => acc + (parseFloat(curr.credit || 0) - parseFloat(curr.debit || 0)), 0);

    // Total Equity includes Current Year Earnings (Net Income)
    const totalEquity = totalEquityRaw + netIncome;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Neraca (Balance Sheet)</h1>
                {selectedPeriod && (
                    <div style={{ color: '#718096' }}>
                        Per Tanggal: {new Date(selectedPeriod.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                )}
            </div>

            <div className="card">
                {loading ? <div className="loading">Loading...</div> : (
                    <div className="balance-sheet-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                        {/* LEFT COLUMN: ASSETS */}
                        <div className="column">
                            <h3 style={{ borderBottom: '2px solid #4299e1', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#2b6cb0' }}>Aset (Assets)</h3>
                            <table className="data-table">
                                <tbody>
                                    {assets.length === 0 ? <tr><td>-</td></tr> : assets.map(row => {
                                        const val = parseFloat(row.debit || 0) - parseFloat(row.credit || 0);
                                        if (val === 0) return null;
                                        return (
                                            <tr key={row.code}>
                                                <td>{row.code} - {row.name}</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(val)}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#ebf8ff' }}>
                                        <td>Total Aset</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(totalAssets)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* RIGHT COLUMN: LIABILITIES + EQUITY */}
                        <div className="column">
                            {/* LIABILITIES */}
                            <h3 style={{ borderBottom: '2px solid #ed8936', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#c05621' }}>Kewajiban (Liabilities)</h3>
                            <table className="data-table" style={{ marginBottom: '2rem' }}>
                                <tbody>
                                    {liabilities.length === 0 ? <tr><td>-</td></tr> : liabilities.map(row => {
                                        const val = parseFloat(row.credit || 0) - parseFloat(row.debit || 0);
                                        if (val === 0) return null;
                                        return (
                                            <tr key={row.code}>
                                                <td>{row.code} - {row.name}</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(val)}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#fffaf0' }}>
                                        <td>Total Kewajiban</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(totalLiabilities)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* EQUITY */}
                            <h3 style={{ borderBottom: '2px solid #9f7aea', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#6b46c1' }}>Ekuitas (Equity)</h3>
                            <table className="data-table">
                                <tbody>
                                    {equities.map(row => {
                                        const val = parseFloat(row.credit || 0) - parseFloat(row.debit || 0);
                                        if (val === 0) return null;
                                        return (
                                            <tr key={row.code}>
                                                <td>{row.code} - {row.name}</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(val)}</td>
                                            </tr>
                                        );
                                    })}
                                    {/* Calculated Net Income Line */}
                                    <tr>
                                        <td style={{ fontStyle: 'italic' }}>Laba Tahun Berjalan (Current Earnings)</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(netIncome)}</td>
                                    </tr>
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f3ebff' }}>
                                        <td>Total Ekuitas</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(totalEquity)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* TOTAL LIAB + EQUITY */}
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: '#edf2f7',
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontWeight: 'bold'
                            }}>
                                <span>Total Kewajiban & Ekuitas</span>
                                <span>{formatCurrency(totalLiabilities + totalEquity)}</span>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

export default BalanceSheetReport;
