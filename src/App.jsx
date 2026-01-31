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
import SOOutstandingReport from './pages/report/SOOutstandingReport';
import ReceivingOutstandingReport from './pages/report/ReceivingOutstandingReport';
import ShipmentOutstandingReport from './pages/report/ShipmentOutstandingReport';
import APOutstandingReport from './pages/report/APOutstandingReport';
import AROutstandingReport from './pages/report/AROutstandingReport';
import APAgingReport from './pages/report/APAgingReport';
import ARAgingReport from './pages/report/ARAgingReport';
import SalesReport from './pages/report/SalesReport';
import PurchaseReport from './pages/report/PurchaseReport';
import TrialBalanceReport from './pages/report/TrialBalanceReport';
import ProfitLossReport from './pages/report/ProfitLossReport';
import BalanceSheetReport from './pages/report/BalanceSheetReport';
import GlSettings from './pages/settings/GlSettings';
import SystemGeneratedJournalList from './pages/finance/SystemGeneratedJournalList';
import CashList from './pages/finance/CashList';
import BankList from './pages/finance/BankList';
import JournalVoucherList from './pages/finance/JournalVoucherList';
import RecalculateInventory from './pages/inventory/RecalculateInventory';
import JasperReports from './pages/report/JasperReports';
import InventoryAdjustmentList from './pages/transaction/InventoryAdjustmentList';
import APAdjustmentList from './pages/transaction/APAdjustmentList';
import ARAdjustmentList from './pages/transaction/ARAdjustmentList';
import './index.css';

import { PeriodProvider } from './context/PeriodContext';

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
            case 'report/sales-summary':
                return <SalesReport />;
            case 'report/purchase-summary':
                return <PurchaseReport />;
            case 'report/trial-balance':
                return <TrialBalanceReport />;
            case 'report/profit-loss':
                return <ProfitLossReport />;
            case 'report/balance-sheet':
                return <BalanceSheetReport />;
            case 'report/po-outstanding':
                return <POOutstandingReport />;
            case 'report/so-outstanding':
                return <SOOutstandingReport />;
            case 'report/receiving-outstanding':
                return <ReceivingOutstandingReport />;
            case 'report/shipment-outstanding':
                return <ShipmentOutstandingReport />;
            case 'report/ap-outstanding':
                return <APOutstandingReport />;
            case 'report/ar-outstanding':
                return <AROutstandingReport />;
            case 'report/ap-aging':
                return <APAgingReport />;
            case 'report/ar-aging':
                return <ARAgingReport />;
            case 'report/crystal-reports':
                return <JasperReports setCurrentPage={setCurrentPage} />;
            case 'gl-settings':
                return <GlSettings />;
            case 'system-generated-journal':
                return <SystemGeneratedJournalList />;
            case 'recalculate-inventory':
                return <RecalculateInventory />;
            case 'cash-in':
                return <CashList transactionType="IN" />;
            case 'cash-out':
                return <CashList transactionType="OUT" />;
            case 'bank-in':
                return <BankList transactionType="IN" />;
            case 'bank-out':
                return <BankList transactionType="OUT" />;
            case 'journal-voucher':
                return <JournalVoucherList />;
            case 'inventory-adjustment-in':
                return <InventoryAdjustmentList adjustmentType="IN" />;
            case 'inventory-adjustment-out':
                return <InventoryAdjustmentList adjustmentType="OUT" />;
            case 'ap-debit-adjustment':
                return <APAdjustmentList adjustmentType="DEBIT" />;
            case 'ap-credit-adjustment':
                return <APAdjustmentList adjustmentType="CREDIT" />;
            case 'ar-debit-adjustment':
                return <ARAdjustmentList adjustmentType="DEBIT" />;
            case 'ar-credit-adjustment':
                return <ARAdjustmentList adjustmentType="CREDIT" />;
            default:
                return <Dashboard connectionStatus={connectionStatus} onRetryConnection={checkConnection} />;
        }
    };

    return (
        <PeriodProvider>
            <div className="app-container">
                <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
                <main className="main-content">
                    {renderPage()}
                </main>
            </div>
        </PeriodProvider>
    );
}

export default App;
