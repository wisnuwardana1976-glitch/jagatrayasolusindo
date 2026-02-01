import { useState, useEffect } from 'react';

function StockReport() {
    const [view, setView] = useState('summary'); // 'summary', 'warehouse', 'location', 'card'
    const [data, setData] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [stockCardData, setStockCardData] = useState(null);

    useEffect(() => {
        fetchWarehouses();
    }, []);

    useEffect(() => {
        if (view !== 'card') {
            fetchData();
        }
    }, [view, selectedWarehouse]);

    const fetchWarehouses = async () => {
        try {
            const res = await fetch('/api/warehouses');
            const result = await res.json();
            if (result.success) {
                setWarehouses(result.data);
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '';
            const params = new URLSearchParams();

            if (search) params.append('search', search);
            if (selectedWarehouse) params.append('warehouse_id', selectedWarehouse);

            switch (view) {
                case 'summary':
                    url = '/api/reports/stock-summary';
                    break;
                case 'warehouse':
                    url = '/api/reports/stock-by-warehouse';
                    break;
                case 'location':
                    url = '/api/reports/stock-by-location';
                    break;
                default:
                    url = '/api/reports/stock-summary';
            }

            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;

            const res = await fetch(url);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching stock data:', error);
        }
        setLoading(false);
    };

    const fetchStockCard = async (itemId) => {
        setLoading(true);
        try {
            let url = `/api/reports/stock-card/${itemId}`;
            if (selectedWarehouse) url += `?warehouse_id=${selectedWarehouse}`;

            const res = await fetch(url);
            const result = await res.json();
            if (result.success) {
                setStockCardData(result.data);
                setView('card');
            }
        } catch (error) {
            console.error('Error fetching stock card:', error);
        }
        setLoading(false);
    };

    const handleSearch = () => {
        fetchData();
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    const formatNumber = (val) => new Intl.NumberFormat('id-ID').format(val || 0);

    // Calculate totals
    const totalQuantity = data.reduce((sum, item) => sum + parseFloat(item.total_quantity || item.quantity || 0), 0);
    const totalValue = data.reduce((sum, item) => sum + parseFloat(item.total_value || item.stock_value || 0), 0);

    // ==================== STYLES ====================
    const styles = {
        container: {
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            margin: '20px',
        },
        header: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '24px 32px',
        },
        headerTitle: {
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: 0,
            marginBottom: '16px',
        },
        tabs: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
        },
        tab: {
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease',
        },
        tabActive: {
            background: '#ffffff',
            color: '#059669',
        },
        tabInactive: {
            background: 'rgba(255,255,255,0.2)',
            color: '#ffffff',
        },
        body: {
            padding: '32px',
        },
        filterRow: {
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
        },
        filterGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
        },
        filterLabel: {
            fontSize: '0.85rem',
            fontWeight: '600',
            color: '#64748b',
        },
        filterInput: {
            padding: '10px 14px',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            fontSize: '0.95rem',
            minWidth: '200px',
        },
        btnSearch: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
        },
        btnBack: {
            background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '20px',
        },
        summaryCards: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
        },
        summaryCard: {
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        },
        summaryLabel: {
            fontSize: '0.85rem',
            color: '#64748b',
            marginBottom: '8px',
        },
        summaryValue: {
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#1e293b',
        },
        table: {
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0 8px',
        },
        th: {
            padding: '14px 16px',
            textAlign: 'left',
            fontWeight: '600',
            color: '#64748b',
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: '2px solid #e2e8f0',
        },
        thRight: {
            textAlign: 'right',
        },
        tr: {
            background: '#ffffff',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            borderRadius: '8px',
        },
        td: {
            padding: '16px',
            fontSize: '0.95rem',
            color: '#334155',
        },
        tdFirst: {
            borderTopLeftRadius: '8px',
            borderBottomLeftRadius: '8px',
        },
        tdLast: {
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
        },
        tdRight: {
            textAlign: 'right',
        },
        itemCode: {
            fontWeight: '600',
            color: '#3b82f6',
            cursor: 'pointer',
        },
        itemName: {
            color: '#64748b',
            fontSize: '0.9rem',
        },
        warehouseTag: {
            display: 'inline-block',
            padding: '4px 10px',
            background: '#e0f2fe',
            color: '#0369a1',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
        },
        locationTag: {
            display: 'inline-block',
            padding: '4px 10px',
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
        },
        emptyState: {
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8',
        },
        cardSection: {
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
        },
        cardTitle: {
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#334155',
            marginBottom: '16px',
        },
    };

    // Render Stock Card View
    if (view === 'card' && stockCardData) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2 style={styles.headerTitle}>📊 Kartu Stok - {stockCardData.item.code}</h2>
                </div>
                <div style={styles.body}>
                    <button style={styles.btnBack} onClick={() => { setView('summary'); setStockCardData(null); }}>
                        ← Kembali ke Daftar
                    </button>

                    <div style={styles.cardSection}>
                        <h3 style={styles.cardTitle}>📦 Informasi Item</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div><strong>Kode:</strong> {stockCardData.item.code}</div>
                            <div><strong>Nama:</strong> {stockCardData.item.name}</div>
                            <div><strong>Satuan:</strong> {stockCardData.item.unit || 'Unit'}</div>
                        </div>
                    </div>

                    <div style={styles.cardSection}>
                        <h3 style={styles.cardTitle}>📍 Stok Saat Ini</h3>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Gudang</th>
                                    <th style={{ ...styles.th, ...styles.thRight }}>Qty</th>
                                    <th style={{ ...styles.th, ...styles.thRight }}>Avg Cost</th>
                                    <th style={{ ...styles.th, ...styles.thRight }}>Nilai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockCardData.currentStock.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Tidak ada stok</td></tr>
                                ) : (
                                    stockCardData.currentStock.map((s, idx) => (
                                        <tr key={idx} style={styles.tr}>
                                            <td style={{ ...styles.td, ...styles.tdFirst }}>{s.warehouse_name || s.warehouse_code}</td>
                                            <td style={{ ...styles.td, ...styles.tdRight }}>{formatNumber(s.quantity)}</td>
                                            <td style={{ ...styles.td, ...styles.tdRight }}>{formatCurrency(s.average_cost)}</td>
                                            <td style={{ ...styles.td, ...styles.tdRight, ...styles.tdLast }}>{formatCurrency(s.quantity * s.average_cost)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={styles.cardSection}>
                        <h3 style={styles.cardTitle}>📋 Riwayat Transaksi</h3>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Tipe</th>
                                    <th style={styles.th}>No. Dokumen</th>
                                    <th style={styles.th}>Tanggal</th>
                                    <th style={styles.th}>Partner</th>
                                    <th style={{ ...styles.th, ...styles.thRight }}>Masuk</th>
                                    <th style={{ ...styles.th, ...styles.thRight }}>Keluar</th>
                                    <th style={{ ...styles.th, ...styles.thRight }}>Harga</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockCardData.transactions.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Belum ada transaksi</td></tr>
                                ) : (
                                    stockCardData.transactions.map((t, idx) => (
                                        <tr key={idx} style={styles.tr}>
                                            <td style={{ ...styles.td, ...styles.tdFirst }}>
                                                <span style={styles.warehouseTag}>{t.trans_type}</span>
                                            </td>
                                            <td style={styles.td}>{t.doc_number}</td>
                                            <td style={styles.td}>{new Date(t.trans_date).toLocaleDateString('id-ID')}</td>
                                            <td style={styles.td}>{t.partner_name || '-'}</td>
                                            <td style={{ ...styles.td, ...styles.tdRight, color: '#16a34a' }}>{t.qty_in > 0 ? formatNumber(t.qty_in) : '-'}</td>
                                            <td style={{ ...styles.td, ...styles.tdRight, color: '#dc2626' }}>{t.qty_out > 0 ? formatNumber(t.qty_out) : '-'}</td>
                                            <td style={{ ...styles.td, ...styles.tdRight, ...styles.tdLast }}>{formatCurrency(t.unit_cost)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.headerTitle}>📊 Laporan Stok</h2>
                <div style={styles.tabs}>
                    <button
                        style={{ ...styles.tab, ...(view === 'summary' ? styles.tabActive : styles.tabInactive) }}
                        onClick={() => setView('summary')}
                    >
                        📦 Ringkasan
                    </button>
                    <button
                        style={{ ...styles.tab, ...(view === 'warehouse' ? styles.tabActive : styles.tabInactive) }}
                        onClick={() => setView('warehouse')}
                    >
                        🏭 Per Gudang
                    </button>
                    <button
                        style={{ ...styles.tab, ...(view === 'location' ? styles.tabActive : styles.tabInactive) }}
                        onClick={() => setView('location')}
                    >
                        📍 Per Lokasi
                    </button>
                </div>
            </div>
            <div style={styles.body}>
                {/* Filter Row */}
                <div style={styles.filterRow}>
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Gudang</label>
                        <select
                            style={styles.filterInput}
                            value={selectedWarehouse}
                            onChange={(e) => setSelectedWarehouse(e.target.value)}
                        >
                            <option value="">Semua Gudang</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.code} - {w.description || w.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Cari Item</label>
                        <input
                            type="text"
                            style={styles.filterInput}
                            placeholder="Kode atau nama item..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <button style={styles.btnSearch} onClick={handleSearch}>
                        🔍 Cari
                    </button>
                </div>

                {/* Summary Cards */}
                <div style={styles.summaryCards}>
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryLabel}>Total Item</div>
                        <div style={styles.summaryValue}>{formatNumber(view === 'summary' ? data.length : [...new Set(data.map(d => d.item_id))].length)}</div>
                    </div>
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryLabel}>Total Quantity</div>
                        <div style={styles.summaryValue}>{formatNumber(totalQuantity)}</div>
                    </div>
                    <div style={{ ...styles.summaryCard, background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' }}>
                        <div style={styles.summaryLabel}>Total Nilai Stok</div>
                        <div style={{ ...styles.summaryValue, color: '#16a34a' }}>{formatCurrency(totalValue)}</div>
                    </div>
                </div>

                {/* Data Table */}
                {loading ? (
                    <div style={styles.emptyState}>⏳ Memuat data...</div>
                ) : data.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                        <div>Tidak ada data stok</div>
                    </div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Kode Item</th>
                                <th style={styles.th}>Nama Item</th>
                                {view === 'warehouse' && <th style={styles.th}>Gudang</th>}
                                {view === 'location' && (
                                    <>
                                        <th style={styles.th}>Gudang</th>
                                        <th style={styles.th}>Lokasi</th>
                                    </>
                                )}
                                <th style={styles.th}>Satuan</th>
                                <th style={{ ...styles.th, ...styles.thRight }}>Qty</th>
                                <th style={{ ...styles.th, ...styles.thRight }}>Avg Cost</th>
                                <th style={{ ...styles.th, ...styles.thRight }}>Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => (
                                <tr key={idx} style={styles.tr}>
                                    <td style={{ ...styles.td, ...styles.tdFirst }}>
                                        <span
                                            style={styles.itemCode}
                                            onClick={() => fetchStockCard(item.item_id)}
                                            title="Klik untuk melihat kartu stok"
                                        >
                                            {item.item_code}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <div>{item.item_name}</div>
                                    </td>
                                    {view === 'warehouse' && (
                                        <td style={styles.td}>
                                            <span style={styles.warehouseTag}>{item.warehouse_code}</span>
                                        </td>
                                    )}
                                    {view === 'location' && (
                                        <>
                                            <td style={styles.td}>
                                                <span style={styles.warehouseTag}>{item.warehouse_code}</span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.locationTag}>{item.location_code || '-'}</span>
                                            </td>
                                        </>
                                    )}
                                    <td style={styles.td}>{item.unit_name}</td>
                                    <td style={{ ...styles.td, ...styles.tdRight, fontWeight: '600' }}>
                                        {formatNumber(item.total_quantity || item.quantity || 0)}
                                    </td>
                                    <td style={{ ...styles.td, ...styles.tdRight }}>
                                        {formatCurrency(item.average_cost || 0)}
                                    </td>
                                    <td style={{ ...styles.td, ...styles.tdRight, ...styles.tdLast, fontWeight: '600', color: '#16a34a' }}>
                                        {formatCurrency(item.total_value || item.stock_value || 0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f1f5f9' }}>
                                <td colSpan={view === 'location' ? 5 : view === 'warehouse' ? 4 : 3} style={{ ...styles.td, fontWeight: '700' }}>
                                    TOTAL
                                </td>
                                <td style={{ ...styles.td, ...styles.tdRight, fontWeight: '700' }}>
                                    {formatNumber(totalQuantity)}
                                </td>
                                <td style={styles.td}></td>
                                <td style={{ ...styles.td, ...styles.tdRight, fontWeight: '700', color: '#16a34a' }}>
                                    {formatCurrency(totalValue)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
}

export default StockReport;
