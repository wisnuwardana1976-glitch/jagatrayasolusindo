const menuItems = [
    {
        section: 'Menu Utama',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'home' },
        ],
    },
    {
        section: 'Master Data',
        items: [
            { id: 'entity', label: 'Entity', icon: 'building' },
            { id: 'site', label: 'Site', icon: 'map-pin' },
            { id: 'warehouse', label: 'Warehouse', icon: 'home' },
            { id: 'sub-warehouse', label: 'Sub Warehouse', icon: 'box' },
            { id: 'location', label: 'Location', icon: 'map' },
            { id: 'supplier', label: 'Supplier', icon: 'truck' },
            { id: 'customer', label: 'Customer', icon: 'users' },
            { id: 'item', label: 'Master Item', icon: 'package' },
            { id: 'unit', label: 'Satuan', icon: 'ruler' },
            { id: 'transcode', label: 'Tipe Transaksi', icon: 'hash' },
            { id: 'transaction', label: 'Transcode', icon: 'list' },
            { id: 'coa', label: 'Chart of Accounts', icon: 'book-open' },
            { id: 'account-group', label: 'Group COA', icon: 'list' },
            { id: 'coa-segment', label: 'COA Segment', icon: 'hash' },
            { id: 'salesperson', label: 'Sales Person', icon: 'user' },
            { id: 'payment-term', label: 'Term of Payment', icon: 'credit-card' },
        ],
    },
    {
        section: 'Warehouse Group',
        items: [
            { id: 'warehouse', label: 'Warehouse', icon: 'home' },
            { id: 'sub-warehouse', label: 'Sub Warehouse', icon: 'box' },
            { id: 'location', label: 'Location', icon: 'map' },
            { id: 'recalculate-inventory', label: 'Recalculate Stock', icon: 'rotate-cw' },
        ],
    },
    {
        section: 'Pembelian',
        items: [
            { id: 'purchase-order', label: 'Purchase Order', icon: 'file-text' },
            { id: 'receiving', label: 'Receiving', icon: 'download' },
            { id: 'purchase-return', label: 'Purchase Return', icon: 'rotate-ccw' },
            { id: 'ap-invoice', label: 'AP Invoice', icon: 'file-minus' },
        ],
    },
    {
        section: 'Penjualan',
        items: [
            { id: 'sales-order', label: 'Sales Order', icon: 'shopping-cart' },
            { id: 'shipment', label: 'Shipment', icon: 'send' },
            { id: 'sales-return', label: 'Sales Return', icon: 'rotate-cw' },
            { id: 'ar-invoice', label: 'AR Invoice', icon: 'file-plus' },
        ],
    },
    {
        section: 'Laporan',
        items: [
            { id: 'report/sales-summary', label: 'Laporan Penjualan', icon: 'file-text' },
            { id: 'report/purchase-summary', label: 'Laporan Pembelian', icon: 'file-text' },
            { id: 'report/trial-balance', label: 'Neraca Saldo', icon: 'book-open' },
            { id: 'report/profit-loss', label: 'Laba Rugi', icon: 'dollar-sign' },
            { id: 'report/balance-sheet', label: 'Neraca', icon: 'building' },
            { id: 'report/po-outstanding', label: 'PO Outstanding', icon: 'file-text' },
            { id: 'report/so-outstanding', label: 'SO Outstanding', icon: 'file-text' },
            { id: 'report/receiving-outstanding', label: 'Receiving Outstanding', icon: 'file-text' },
            { id: 'report/shipment-outstanding', label: 'Shipment Outstanding', icon: 'file-text' },
            { id: 'report/ap-outstanding', label: 'AP Outstanding', icon: 'file-text' },
            { id: 'report/ar-outstanding', label: 'AR Outstanding', icon: 'file-text' },
            { id: 'report/ap-aging', label: 'AP Aging', icon: 'file-text' },
            { id: 'report/ar-aging', label: 'AR Aging', icon: 'file-text' },
            { id: 'report/crystal-reports', label: 'Crystal Reports', icon: 'file-text' },
        ],
    },
    {
        section: 'Keuangan',
        items: [
            { id: 'cash-in', label: 'Kas Masuk', icon: 'dollar-sign' },
            { id: 'cash-out', label: 'Kas Keluar', icon: 'dollar-sign' },
            { id: 'bank-in', label: 'Bank Masuk', icon: 'credit-card' },
            { id: 'bank-out', label: 'Bank Keluar', icon: 'credit-card' },
            { id: 'journal-voucher', label: 'Jurnal Voucher', icon: 'book-open' },
            { id: 'system-generated-journal', label: 'Auto Journal', icon: 'file-text' },
        ],
    },
    {
        section: 'Adjustment',
        items: [
            { id: 'inventory-adjustment-in', label: 'Inventory Adj. In', icon: 'download' },
            { id: 'inventory-adjustment-out', label: 'Inventory Adj. Out', icon: 'send' },
            { id: 'ap-debit-adjustment', label: 'AP Debit Adj.', icon: 'file-minus' },
            { id: 'ap-credit-adjustment', label: 'AP Credit Adj.', icon: 'file-plus' },
            { id: 'ar-debit-adjustment', label: 'AR Debit Adj.', icon: 'file-plus' },
            { id: 'ar-credit-adjustment', label: 'AR Credit Adj.', icon: 'file-minus' },
        ],
    },
];

const icons = {
    home: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
    ),

    building: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="9" y1="22" x2="9" y2="2"></line>
            <path d="M5 12h14"></path>
            <path d="M5 7h14"></path>
            <path d="M5 17h14"></path>
        </svg>
    ),
    'map-pin': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
    ),

    map: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
        </svg>
    ),
    box: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
    ),
    truck: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
    ),
    users: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
    ),
    package: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
    ),
    user: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    ),
    'file-text': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    ),
    download: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
    ),
    'rotate-ccw': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
    ),
    'file-minus': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
    ),
    'shopping-cart': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
    ),
    send: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    ),
    'rotate-cw': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
    ),
    'file-plus': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
    ),
    'dollar-sign': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
    ),
    'credit-card': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
    ),
    'book-open': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
    ),
    'ruler': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
            <path d="m15 5 4 4"></path>
            <path d="m11 9 2 2"></path>
            <path d="m7 13 2 2"></path>
        </svg>
    ),
    'hash': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="9" x2="20" y2="9"></line>
            <line x1="4" y1="15" x2="20" y2="15"></line>
            <line x1="10" y1="3" x2="8" y2="21"></line>
            <line x1="16" y1="3" x2="14" y2="21"></line>
        </svg>
    ),
    'list': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
    ),
    'settings': (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    ),
    calendar: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    ),
};

import { useState, useEffect } from 'react';
import { usePeriod } from '../context/PeriodContext';

function Sidebar({ currentPage, setCurrentPage }) {
    const [activeMenuConfig, setActiveMenuConfig] = useState(null);
    const { selectedPeriod, setSelectedPeriod, periods } = usePeriod();

    useEffect(() => {
        loadMenuConfig();
    }, []);

    const loadMenuConfig = () => {
        const saved = localStorage.getItem('sidebar_menu_config_v2');
        if (saved) {
            try {
                setActiveMenuConfig(JSON.parse(saved));
            } catch (e) {
                setActiveMenuConfig(null);
            }
        }
    };

    // Use saved config or default menuItems
    const getDisplayMenu = () => {
        if (!activeMenuConfig) {
            return menuItems;
        }

        // Filter and sort based on saved config
        return activeMenuConfig
            .filter(section => section.visible)
            .sort((a, b) => a.order - b.order)
            .map(section => ({
                section: section.section,
                items: section.items
                    .filter(item => item.visible)
                    .sort((a, b) => a.order - b.order)
            }));
    };

    const displayMenu = getDisplayMenu();

    // Toggle section expansion
    const toggleSection = (sectionName) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    // Check if section has active item
    const hasActiveItem = (section) => {
        return section.items.some(item => item.id === currentPage);
    };

    // Initialize expanded sections state
    const [expandedSections, setExpandedSections] = useState(() => {
        // Default: expand all sections initially
        const initial = {};
        menuItems.forEach(s => { initial[s.section] = true; });
        return initial;
    });

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1>JAGATRAYA</h1>
                <p>Enterprise Resource Planning</p>
            </div>

            <div className="period-selector" style={{ padding: '0 1rem 1rem 1rem', borderBottom: '1px solid #48546b', marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a0aec0', marginBottom: '0.25rem' }}>Periode Akuntansi</label>
                <select
                    value={selectedPeriod ? selectedPeriod.id : ''}
                    onChange={(e) => {
                        const pid = parseInt(e.target.value);
                        const p = periods.find(p => p.id === pid);
                        setSelectedPeriod(p || null);
                    }}
                    style={{
                        width: '100%',
                        padding: '0.4rem',
                        fontSize: '0.85rem',
                        backgroundColor: '#2d3748',
                        color: 'white',
                        border: '1px solid #4a5568',
                        borderRadius: '4px',
                        outline: 'none'
                    }}
                >
                    <option value="">-- Semua Periode --</option>
                    {periods.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} ({p.status})
                        </option>
                    ))}
                </select>
                {selectedPeriod && (
                    <div style={{ fontSize: '0.7rem', color: '#718096', marginTop: '4px' }}>
                        Filter: {new Date(selectedPeriod.start_date).toLocaleDateString()} - {new Date(selectedPeriod.end_date).toLocaleDateString()}
                    </div>
                )}
            </div>

            {displayMenu.map((section) => (
                <div key={section.section} className="nav-section">
                    <div
                        className="nav-section-title"
                        onClick={() => toggleSection(section.section)}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            userSelect: 'none'
                        }}
                    >
                        <span>{section.section}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                            {expandedSections[section.section] ? '▼' : '▶'}
                        </span>
                    </div>
                    {expandedSections[section.section] && section.items.map((item) => (
                        <div
                            key={item.id}
                            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                            onClick={() => setCurrentPage(item.id)}
                        >
                            {icons[item.icon]}
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            ))}

            {/* Settings Section - Always visible */}
            <div className="nav-section">
                <div
                    className="nav-section-title"
                    onClick={() => toggleSection('Pengaturan')}
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                    }}
                >
                    <span>Pengaturan</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        {expandedSections['Pengaturan'] ? '▼' : '▶'}
                    </span>
                </div>
                {expandedSections['Pengaturan'] !== false && (
                    <>
                        <div
                            className={`nav-item ${currentPage === 'menu-settings' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('menu-settings')}
                        >
                            {icons['settings']}
                            <span>Pengaturan Menu</span>
                        </div>
                        <div
                            className={`nav-item ${currentPage === 'accounting-period' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('accounting-period')}
                        >
                            {icons['calendar']}
                            <span>Periode Akuntansi</span>
                        </div>
                        <div
                            className={`nav-item ${currentPage === 'gl-settings' ? 'active' : ''}`}
                            onClick={() => setCurrentPage('gl-settings')}
                        >
                            {icons['settings']}
                            <span>GL Settings</span>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
