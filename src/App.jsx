import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ItemList from './pages/master/ItemList';
import PartnerList from './pages/master/PartnerList';
import SalesPersonList from './pages/master/SalesPersonList';
import PurchaseOrderList from './pages/transaction/PurchaseOrderList';
import SalesOrderList from './pages/transaction/SalesOrderList';
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
            case 'item':
                return <ItemList />;
            case 'supplier':
                return <PartnerList type="Supplier" />;
            case 'customer':
                return <PartnerList type="Customer" />;
            case 'salesperson':
                return <SalesPersonList />;
            case 'purchase-order':
                return <PurchaseOrderList />;
            case 'sales-order':
                return <SalesOrderList />;
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
