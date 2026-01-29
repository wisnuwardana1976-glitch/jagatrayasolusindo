
import { useState, useEffect } from 'react';
import { usePeriod } from '../../context/PeriodContext';
import TransactionDetailModal from '../../components/TransactionDetailModal';

function TrialBalanceReport() {
    const { selectedPeriod } = usePeriod();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Drill-down states
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (selectedPeriod) {
            fetchData();
        }
    }, [selectedPeriod]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const formatDate = (d) => new Date(d).toISOString().split('T')[0];
            const query = new URLSearchParams({
                startDate: formatDate(selectedPeriod.start_date),
                endDate: formatDate(selectedPeriod.end_date)
            }).toString();

            const response = await fetch(`/api/reports/trial-balance?${query}`);
            const result = await response.json();

            if (result.success) {
                // Show all accounts or filter? Usually TB shows all that have activity or balance.
                // Assuming backend returns all, we filter those with all zeros if desired, 
                // but usually seeing zero balance accounts is fine if they had movement. 
                // Let's filter out completely dead accounts (all 0) to keep it clean.
                const activeData = result.data.filter(d =>
                    d.initial_balance !== 0 ||
                    d.movement_debit !== 0 ||
                    d.movement_credit !== 0 ||
                    d.ending_balance !== 0
                );
                setData(activeData);
            }
        } catch (error) {
            console.error('Error fetching trial balance:', error);
        }
        setLoading(false);
    };

    const handleRowClick = (account) => {
        setSelectedAccount(account);
        setIsModalOpen(true);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

    // Totals
    const totalOpening = data.reduce((acc, curr) => acc + curr.initial_balance, 0); // Note: Mixed types (Dr/Cr) might sum oddly for Net
    const totalMutDebit = data.reduce((acc, curr) => acc + curr.movement_debit, 0);
    const totalMutCredit = data.reduce((acc, curr) => acc + curr.movement_credit, 0);
    const totalEnding = data.reduce((acc, curr) => acc + curr.ending_balance, 0);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Neraca Saldo (Trial Balance)</h1>
                {selectedPeriod && (
                    <div style={{ color: '#718096' }}>
                        Periode: {new Date(selectedPeriod.start_date).toLocaleDateString('id-ID')} s/d {new Date(selectedPeriod.end_date).toLocaleDateString('id-ID')}
                    </div>
                )}
            </div>

            <div className="card">
                {loading ? <div className="loading">Loading...</div> : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th rowSpan="2" style={{ verticalAlign: 'middle' }}>Kode Akun</th>
                                    <th rowSpan="2" style={{ verticalAlign: 'middle' }}>Nama Akun</th>
                                    <th style={{ textAlign: 'right' }}>Saldo Awal</th>
                                    <th colSpan="2" style={{ textAlign: 'center' }}>Pergerakan (Mutation)</th>
                                    <th style={{ textAlign: 'right' }}>Saldo Akhir</th>
                                </tr>
                                <tr>
                                    <th style={{ textAlign: 'right', fontSize: '0.9em' }}>Net</th>
                                    <th style={{ textAlign: 'right', fontSize: '0.9em' }}>Debit</th>
                                    <th style={{ textAlign: 'right', fontSize: '0.9em' }}>Kredit</th>
                                    <th style={{ textAlign: 'right', fontSize: '0.9em' }}>Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>Tidak ada data</td></tr>
                                ) : (
                                    data.map((row) => (
                                        <tr
                                            key={row.code}
                                            onClick={() => handleRowClick(row)}
                                            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                            className="hover:bg-gray-100"
                                            title="Klik untuk lihat detail transaksi"
                                        >
                                            <td>{row.code}</td>
                                            <td>{row.name}</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(row.initial_balance)}</td>
                                            <td style={{ textAlign: 'right', color: row.movement_debit > 0 ? 'inherit' : '#ccc' }}>
                                                {formatCurrency(row.movement_debit)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: row.movement_credit > 0 ? 'inherit' : '#ccc' }}>
                                                {formatCurrency(row.movement_credit)}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(row.ending_balance)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f7fafc' }}>
                                    <td colSpan="2" style={{ textAlign: 'right' }}>Total</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalOpening)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalMutDebit)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalMutCredit)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalEnding)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#718096' }}>
                            * Klik pada baris akun untuk melihat detail transaksi.
                        </div>
                    </>
                )}
            </div>

            {isModalOpen && selectedAccount && selectedPeriod && (
                <TransactionDetailModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    accountId={selectedAccount.id}
                    accountName={`${selectedAccount.code} - ${selectedAccount.name}`}
                    startDate={selectedPeriod.start_date}
                    endDate={selectedPeriod.end_date}
                />
            )}
        </div>
    );
}

export default TrialBalanceReport;
