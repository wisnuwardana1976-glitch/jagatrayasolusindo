
import { useState, useEffect } from 'react';
import { usePeriod } from '../../context/PeriodContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function PurchaseReport() {
    const { selectedPeriod } = usePeriod();
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedPeriod]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/reports/purchase-summary';
            if (selectedPeriod) {
                const formatDate = (d) => new Date(d).toISOString().split('T')[0];
                const query = new URLSearchParams({
                    startDate: formatDate(selectedPeriod.start_date),
                    endDate: formatDate(selectedPeriod.end_date)
                }).toString();
                url += `?${query}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setSummaryData(data.data);
            }
        } catch (error) {
            console.error('Error fetching purchase report:', error);
        }
        setLoading(false);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

    const totalPurchase = summaryData.reduce((acc, curr) => acc + parseFloat(curr.total), 0);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Laporan Pembelian</h1>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', marginBottom: '20px' }}>
                <div className="card">
                    <h3>Total Pembelian (Periode Ini)</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e53e3e' }}>
                        {formatCurrency(totalPurchase)}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px', height: '400px' }}>
                <h3>Grafik Pembelian Bulanan</h3>
                {loading ? <div className="loading">Loading Chart...</div> : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={summaryData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(value)} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="total" name="Total Pembelian" fill="#f56565" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="card">
                <h3>Detail Per Bulan</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Periode</th>
                            <th style={{ textAlign: 'right' }}>Total Pembelian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.length === 0 ? (
                            <tr><td colSpan="2" style={{ textAlign: 'center' }}>Tidak ada data</td></tr>
                        ) : (
                            summaryData.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{row.period}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(row.total)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f7fafc' }}>
                            <td>Grand Total</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(totalPurchase)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export default PurchaseReport;
