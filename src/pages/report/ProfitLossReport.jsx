
import { useState, useEffect } from 'react';
import { usePeriod } from '../../context/PeriodContext';

function ProfitLossReport() {
    const { selectedPeriod } = usePeriod();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedPeriod]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/reports/profit-loss';
            if (selectedPeriod) {
                const formatDate = (d) => new Date(d).toISOString().split('T')[0];
                const query = new URLSearchParams({
                    startDate: formatDate(selectedPeriod.start_date),
                    endDate: formatDate(selectedPeriod.end_date)
                }).toString();
                url += `?${query}`;
            }
            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching profit loss:', error);
        }
        setLoading(false);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

    // Grouping
    const revenues = data.filter(d => d.type === 'REVENUE');
    const expenses = data.filter(d => d.type === 'EXPENSE');

    // Revenue is normally Credit balance (Credit - Debit). If negative, it's a loss/return.
    const totalRevenue = revenues.reduce((acc, curr) => acc + (parseFloat(curr.credit || 0) - parseFloat(curr.debit || 0)), 0);

    // Expense is normally Debit balance (Debit - Credit).
    const totalExpense = expenses.reduce((acc, curr) => acc + (parseFloat(curr.debit || 0) - parseFloat(curr.credit || 0)), 0);

    const netIncome = totalRevenue - totalExpense;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Laporan Laba Rugi (Profit & Loss)</h1>
                {selectedPeriod && (
                    <div style={{ color: '#718096' }}>
                        Periode: {new Date(selectedPeriod.start_date).toLocaleDateString()} - {new Date(selectedPeriod.end_date).toLocaleDateString()}
                    </div>
                )}
            </div>

            <div className="card">
                {loading ? <div className="loading">Loading...</div> : (
                    <div className="report-container" style={{ maxWidth: '800px', margin: '0 auto' }}>

                        {/* REVENUE SECTION */}
                        <div className="report-section">
                            <h3 style={{ borderBottom: '2px solid #48bb78', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#2f855a' }}>Pendapatan (Revenue)</h3>
                            <table className="data-table" style={{ marginBottom: '2rem' }}>
                                <tbody>
                                    {revenues.length === 0 ? (
                                        <tr><td>Tidak ada data pendapatan</td><td style={{ textAlign: 'right' }}>-</td></tr>
                                    ) : (
                                        revenues.map(row => {
                                            const val = parseFloat(row.credit || 0) - parseFloat(row.debit || 0);
                                            if (val === 0) return null;
                                            return (
                                                <tr key={row.code}>
                                                    <td>{row.code} - {row.name}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(val)}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f0fff4' }}>
                                        <td>Total Pendapatan</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(totalRevenue)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* EXPENSE SECTION */}
                        <div className="report-section">
                            <h3 style={{ borderBottom: '2px solid #e53e3e', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#c53030' }}>Biaya (Expenses)</h3>
                            <table className="data-table" style={{ marginBottom: '2rem' }}>
                                <tbody>
                                    {expenses.length === 0 ? (
                                        <tr><td>Tidak ada data biaya</td><td style={{ textAlign: 'right' }}>-</td></tr>
                                    ) : (
                                        expenses.map(row => {
                                            const val = parseFloat(row.debit || 0) - parseFloat(row.credit || 0);
                                            if (val === 0) return null;
                                            return (
                                                <tr key={row.code}>
                                                    <td>{row.code} - {row.name}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(val)}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#fff5f5' }}>
                                        <td>Total Biaya</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(totalExpense)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* NET INCOME */}
                        <div className="grand-total" style={{
                            padding: '1.5rem',
                            backgroundColor: netIncome >= 0 ? '#c6f6d5' : '#fed7d7',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#1a202c'
                        }}>
                            <span>Laba / (Rugi) Bersih</span>
                            <span>{formatCurrency(netIncome)}</span>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfitLossReport;
