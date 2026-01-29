
import React, { useState, useEffect } from 'react';

const TransactionDetailModal = ({ isOpen, onClose, accountId, accountName, startDate, endDate }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && accountId && startDate && endDate) {
            fetchTransactions();
        }
    }, [isOpen, accountId, startDate, endDate]);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                accountId,
                startDate: new Date(startDate).toISOString().split('T')[0],
                endDate: new Date(endDate).toISOString().split('T')[0]
            });
            const response = await fetch(`/api/reports/account-transactions?${params}`);
            const result = await response.json();
            if (result.success) {
                setTransactions(result.data);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Gagal mengambil data transaksi. ' + err.message);
        }
        setLoading(false);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID');

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                width: '80%', maxHeight: '80vh', overflowY: 'auto',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0 }}>Detail Transaksi: {accountName}</h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
                    }}>&times;</button>
                </div>

                {loading ? <p>Loading...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f7fafc' }}>
                                <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>Tanggal</th>
                                <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>No. Bukti</th>
                                <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>Keterangan</th>
                                <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Debit</th>
                                <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Kredit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '10px' }}>Tidak ada transaksi periode ini.</td></tr>
                            ) : (
                                transactions.map((trx, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{formatDate(trx.doc_date)}</td>
                                        <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{trx.doc_number}</td>
                                        <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{trx.description}</td>
                                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>
                                            {trx.debit > 0 ? formatCurrency(trx.debit) : '-'}
                                        </td>
                                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>
                                            {trx.credit > 0 ? formatCurrency(trx.credit) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
                <div style={{ marginTop: '15px', textAlign: 'right' }}>
                    <button onClick={onClose} style={{
                        padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}>Tutup</button>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailModal;
