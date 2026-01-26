
import { useState, useEffect } from 'react';

const GlSettings = () => {
    const [settings, setSettings] = useState({});
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial Schema Definition
    const requiredSettings = [
        { key: 'inventory_account', label: 'Inventory (Persediaan)', type: 'Asset' },
        { key: 'ap_temp_account', label: 'AP Temporary (Hutang Sementara)', type: 'Liability' },
        { key: 'ap_trade_account', label: 'AP Trade (Hutang Dagang)', type: 'Liability' },
        { key: 'uninvoice_shipment_account', label: 'Uninvoiced Shipment', type: 'Asset' },
        { key: 'sales_temp_account', label: 'Sales Temporary (Penjualan Sementara)', type: 'Revenue' },
        { key: 'sales_account', label: 'Sales (Penjualan)', type: 'Revenue' },
        { key: 'ar_trade_account', label: 'AR Trade (Piutang Dagang)', type: 'Asset' },
        { key: 'vat_out_account', label: 'VAT Out (PPN Keluaran)', type: 'Liability' },
        { key: 'vat_in_account', label: 'VAT In (PPN Masukan)', type: 'Asset' },
        { key: 'cogs_account', label: 'COGS (HPP)', type: 'Expense' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [accRes, setRes] = await Promise.all([
                fetch('/api/accounts'),
                fetch('/api/gl-settings')
            ]);

            const accData = await accRes.json();
            const setData = await setRes.json();

            if (accData.success) setAccounts(accData.data);
            if (setData.success) {
                // Transform API response object to simple key-value map for form
                const loadedSettings = {};
                Object.keys(setData.data).forEach(key => {
                    loadedSettings[key] = setData.data[key].account_id;
                });
                setSettings(loadedSettings);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/gl-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
            const data = await response.json();
            if (data.success) {
                alert('Pengaturan GL berhasil disimpan');
            } else {
                alert('Gagal menyimpan: ' + data.error);
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Terjadi kesalahan koneksi');
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <div className="container-fluid">
            <div className="page-header">
                <h1 className="page-title">General Ledger Settings</h1>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Mapping Akun Otomatis</h3>
                    <p className="text-muted">Tentukan akun default untuk jurnal otomatis sistem</p>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {requiredSettings.map(item => (
                                <div key={item.key} className="form-group">
                                    <label>
                                        {item.label}
                                        <span className="badge badge-secondary ml-2" style={{ fontSize: '0.7rem', marginLeft: '8px' }}>{item.type}</span>
                                    </label>
                                    <select
                                        className="form-control"
                                        value={settings[item.key] || ''}
                                        onChange={(e) => handleChange(item.key, e.target.value)}
                                        required
                                    >
                                        <option value="">-- Pilih Akun --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div className="form-actions mt-4" style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary">Simpan Pengaturan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GlSettings;
