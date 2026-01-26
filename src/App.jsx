import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ItemList from './pages/master/ItemList';
import PartnerList from './pages/master/PartnerList';
import SalesPersonList from './pages/master/SalesPersonList';
import UnitList from './pages/master/UnitList';
import TranscodeList from './pages/master/TranscodeList';
import TransactionList from './pages/master/TransactionList';
import CoaList from './pages/master/CoaList';
import CoaSegmentList from './pages/master/CoaSegmentList';
import AccountGroupList from './pages/master/AccountGroupList';
import EntityList from './pages/master/EntityList';
import SiteList from './pages/master/SiteList';
import WarehouseList from './pages/master/WarehouseList';
import SubWarehouseList from './pages/master/SubWarehouseList';
import LocationList from './pages/master/LocationList';
import PurchaseOrderList from './pages/transaction/PurchaseOrderList';
import SalesOrderList from './pages/transaction/SalesOrderList';
import ReceivingList from './pages/transaction/ReceivingList';
import ShipmentList from './pages/transaction/ShipmentList';
import APInvoiceList from './pages/transaction/APInvoiceList';
import ARInvoiceList from './pages/transaction/ARInvoiceList';
import AccountingPeriodList from './pages/settings/AccountingPeriodList';
import MenuSettings from './pages/settings/MenuSettings';
import PaymentTermList from './pages/master/PaymentTermList';
import POOutstandingReport from './pages/report/POOutstandingReport';
import GlSettings from './pages/settings/GlSettings';
import SystemGeneratedJournalList from './pages/finance/SystemGeneratedJournalList';
import RecalculateInventory from './pages/inventory/RecalculateInventory';
import './index.css';

function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [connectionStatus, setConnectionStatus] = useState('checking');

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const response = await fetch('/api/test');
            const data = await response.json();
            setConnectionStatus(data.success ? 'connected' : 'disconnected');
        } catch (error) {
            setConnectionStatus('disconnected');
        }
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard connectionStatus={connectionStatus} onRetryConnection={checkConnection} />;
            case 'entity':
                return <EntityList />;
            case 'site':
                return <SiteList />;
            case 'warehouse':
                return <WarehouseList />;
            case 'sub-warehouse':
                return <SubWarehouseList />;
            case 'accounting-period': // Added case for AccountingPeriodList
                return <AccountingPeriodList />;
            case 'purchase-order': // This case already exists, but the instruction implies adding it again. Keeping the existing one.
                return <PurchaseOrderList />;
            case 'item':
                return <ItemList />;
            case 'unit':
                return <UnitList />;
            case 'supplier':
                return <PartnerList type="Supplier" />;
            case 'customer':
                return <PartnerList type="Customer" />;
            case 'salesperson':
                return <SalesPersonList />;
            case 'transcode':
                return <TranscodeList />;
            case 'transaction':
                return <TransactionList />;
            case 'coa':
                return <CoaList />;
            case 'account-group':
                return <AccountGroupList />;
            case 'coa-segment':
                return <CoaSegmentList />;
            case 'purchase-order':
                return <PurchaseOrderList />;
            case 'receiving':
                return <ReceivingList />;
            case 'shipment':
                return <ShipmentList />;
            case 'ap-invoice':
                return <APInvoiceList />;
            case 'ar-invoice':
                return <ARInvoiceList />;
            case 'sales-order':
                return <SalesOrderList />;
            case 'menu-settings':
                return <MenuSettings />;
            case 'payment-term':
                return <PaymentTermList />;
            case 'report/po-outstanding':
                return <POOutstandingReport />;
            case 'gl-settings':
                return <GlSettings />;
            case 'system-generated-journal':
                return <SystemGeneratedJournalList />;
            case 'recalculate-inventory':
                return <RecalculateInventory />;
            default:
                return <Dashboard connectionStatus={connectionStatus} onRetryConnection={checkConnection} />;
        }
    };

    return (
        <div className="app-container">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <main className="main-content">
                {renderPage()}
            </main>
        </div>
    );
}

export default App;
