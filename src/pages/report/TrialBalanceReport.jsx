
import { useState, useEffect } from 'react';
import { usePeriod } from '../../context/PeriodContext';

function TrialBalanceReport() {
    const { selectedPeriod } = usePeriod();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedPeriod]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/reports/trial-balance';
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
                // Filter out zero balances if preferred, collecting total debits and credits
                setData(result.data.filter(d => d.debit !== 0 || d.credit !== 0));
            }
        } catch (error) {
            console.error('Error fetching trial balance:', error);
        }
        setLoading(false);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

    const totalDebit = data.reduce((acc, curr) => acc + curr.debit, 0);
    const totalCredit = data.reduce((acc, curr) => acc + curr.credit, 0);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Neraca Saldo (Trial Balance)</h1>
                {selectedPeriod && (
                    <div style={{ color: '#718096' }}>
                        Per Tanggal: {new Date(selectedPeriod.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                )}
            </div>

            <div className="card">
                {loading ? <div className="loading">Loading...</div> : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Kode Akun</th>
                                <th>Nama Akun</th>
                                <th style={{ textAlign: 'right' }}>Debit</th>
                                <th style={{ textAlign: 'right' }}>Kredit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center' }}>Tidak ada data</td></tr>
                            ) : (
                                data.map((row) => (
                                    <tr key={row.code}>
                                        <td>{row.code}</td>
                                        <td>{row.name}</td>
                                        <td style={{ textAlign: 'right' }}>{row.debit > 0 ? formatCurrency(row.debit) : '-'}</td>
                                        <td style={{ textAlign: 'right' }}>{row.credit > 0 ? formatCurrency(row.credit) : '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{ fontWeight: 'bold', backgroundColor: '#f7fafc' }}>
                                <td colSpan="2" style={{ textAlign: 'right' }}>Total</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(totalDebit)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(totalCredit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
}

export default TrialBalanceReport;
