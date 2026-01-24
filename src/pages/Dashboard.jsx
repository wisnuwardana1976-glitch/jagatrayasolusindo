import { useState, useEffect } from 'react';

function Dashboard({ connectionStatus, onRetryConnection }) {
    const [stats, setStats] = useState({
        items: 0,
        partners: 0,
        purchaseOrders: 0,
        salesOrders: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (connectionStatus === 'connected') {
            fetchStats();
        }
    }, [connectionStatus]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/dashboard/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <div className={`connection-status ${connectionStatus}`}>
                    <span className={`status-dot ${connectionStatus}`}></span>
                    {connectionStatus === 'checking' && 'Memeriksa koneksi...'}
                    {connectionStatus === 'connected' && 'Database Terhubung'}
                    {connectionStatus === 'disconnected' && (
                        <>
                            Database Tidak Terhubung
                            <button className="btn btn-outline" onClick={onRetryConnection} style={{ marginLeft: '0.5rem' }}>
                                Coba Lagi
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Connection Info */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h3 className="card-title">Informasi Sistem</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <strong>Aplikasi:</strong> Jagatraya ERP
                    </div>
                    <div>
                        <strong>Database:</strong> JAGATRAYA_V17
                    </div>
                    <div>
                        <strong>Server:</strong> localhost:2638
                    </div>
                    <div>
                        <strong>Status:</strong>{' '}
                        <span className={`badge ${connectionStatus === 'connected' ? 'badge-success' : 'badge-danger'}`}>
                            {connectionStatus === 'connected' ? 'Terhubung' : 'Tidak Terhubung'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {connectionStatus === 'connected' && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>{loading ? '...' : stats.items}</h3>
                            <p>Total Item</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon green">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>{loading ? '...' : stats.partners}</h3>
                            <p>Total Partner</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>{loading ? '...' : stats.purchaseOrders}</h3>
                            <p>Purchase Orders</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>{loading ? '...' : stats.salesOrders}</h3>
                            <p>Sales Orders</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            {connectionStatus === 'connected' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Panduan Penggunaan</h3>
                    </div>
                    <div className="quick-guide">
                        <div className="guide-item">
                            <span className="guide-number">1</span>
                            <div>
                                <strong>Master Data</strong>
                                <p>Mulai dengan menambahkan data Item, Supplier, Customer, dan Sales Person</p>
                            </div>
                        </div>
                        <div className="guide-item">
                            <span className="guide-number">2</span>
                            <div>
                                <strong>Transaksi Pembelian</strong>
                                <p>Buat Purchase Order → Receiving → AP Invoice</p>
                            </div>
                        </div>
                        <div className="guide-item">
                            <span className="guide-number">3</span>
                            <div>
                                <strong>Transaksi Penjualan</strong>
                                <p>Buat Sales Order → Shipment → AR Invoice</p>
                            </div>
                        </div>
                        <div className="guide-item">
                            <span className="guide-number">4</span>
                            <div>
                                <strong>Keuangan</strong>
                                <p>Kelola Cash, Bank, dan Jurnal Voucher</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {connectionStatus === 'disconnected' && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Tidak Dapat Terhubung ke Database</h3>
                    <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                        Pastikan server Sybase SQL Anywhere berjalan di localhost:2638
                    </p>
                    <button className="btn btn-primary" onClick={onRetryConnection}>
                        Coba Hubungkan Kembali
                    </button>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
