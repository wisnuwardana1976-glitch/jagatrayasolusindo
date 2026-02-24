import { useState, useEffect } from 'react';

function CurrencyList() {
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState(null);
    const [formData, setFormData] = useState({
        code: '', name: '', symbol: '', decimal_places: 2, is_base: 'N', active: 'Y'
    });

    // Rate management
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [rates, setRates] = useState([]);
    const [showRateForm, setShowRateForm] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [rateFormData, setRateFormData] = useState({
        rate_date: new Date().toISOString().split('T')[0],
        buy_rate: '', sell_rate: '', middle_rate: '', rate_type_id: ''
    });

    // Converter
    const [showConverter, setShowConverter] = useState(false);
    const [convertFrom, setConvertFrom] = useState('');
    const [convertTo, setConvertTo] = useState('');
    const [convertAmount, setConvertAmount] = useState('');
    const [convertResult, setConvertResult] = useState(null);
    const [convertRateTypeId, setConvertRateTypeId] = useState('');
    const [convertPeriod, setConvertPeriod] = useState('date'); // 'date' or 'month'
    const [convertDate, setConvertDate] = useState(new Date().toISOString().split('T')[0]);
    const [convertYear, setConvertYear] = useState(new Date().getFullYear().toString());
    const [convertMonth, setConvertMonth] = useState((new Date().getMonth() + 1).toString());

    // Exchange Rate Types
    const [rateTypes, setRateTypes] = useState([]);

    useEffect(() => { fetchCurrencies(); fetchRateTypes(); }, []);

    const fetchCurrencies = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/currencies');
            const data = await response.json();
            if (data.success) setCurrencies(data.data);
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    };

    const fetchRateTypes = async () => {
        try {
            const response = await fetch('/api/exchange-rate-types');
            const data = await response.json();
            if (data.success) setRateTypes(data.data);
        } catch (error) { console.error('Error:', error); }
    };

    const fetchRates = async (currencyId) => {
        try {
            const response = await fetch(`/api/currencies/${currencyId}/rates`);
            const data = await response.json();
            if (data.success) setRates(data.data);
        } catch (error) { console.error('Error:', error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCurrency ? `/api/currencies/${editingCurrency.id}` : '/api/currencies';
            const method = editingCurrency ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowForm(false);
                setEditingCurrency(null);
                resetForm();
                fetchCurrencies();
            } else { alert('Error: ' + data.error); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const handleEdit = (currency) => {
        setEditingCurrency(currency);
        setFormData({
            code: currency.code, name: currency.name, symbol: currency.symbol || '',
            decimal_places: currency.decimal_places, is_base: currency.is_base, active: currency.active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus currency ini?')) return;
        try {
            const response = await fetch(`/api/currencies/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                if (selectedCurrency && selectedCurrency.id === id) {
                    setSelectedCurrency(null);
                    setRates([]);
                }
                fetchCurrencies();
            } else { alert('Error: ' + data.error); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const resetForm = () => {
        setFormData({ code: '', name: '', symbol: '', decimal_places: 2, is_base: 'N', active: 'Y' });
    };

    const handleSelectCurrency = (currency) => {
        setSelectedCurrency(currency);
        fetchRates(currency.id);
    };

    const handleRateSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingRate
                ? `/api/currency-rates/${editingRate.id}`
                : `/api/currencies/${selectedCurrency.id}/rates`;
            const method = editingRate ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rateFormData)
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowRateForm(false);
                setEditingRate(null);
                resetRateForm();
                fetchRates(selectedCurrency.id);
            } else { alert('Error: ' + data.error); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const handleEditRate = (rate) => {
        setEditingRate(rate);
        setRateFormData({
            rate_date: rate.rate_date ? rate.rate_date.split('T')[0] : '',
            buy_rate: rate.buy_rate, sell_rate: rate.sell_rate, middle_rate: rate.middle_rate,
            rate_type_id: rate.rate_type_id || ''
        });
        setShowRateForm(true);
    };

    const handleDeleteRate = async (id) => {
        if (!confirm('Yakin ingin menghapus kurs ini?')) return;
        try {
            const response = await fetch(`/api/currency-rates/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchRates(selectedCurrency.id);
            }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const resetRateForm = () => {
        setRateFormData({
            rate_date: new Date().toISOString().split('T')[0],
            buy_rate: '', sell_rate: '', middle_rate: '', rate_type_id: ''
        });
    };

    // Auto-calculate middle rate
    const handleBuyRateChange = (val) => {
        const buy = parseFloat(val) || 0;
        const sell = parseFloat(rateFormData.sell_rate) || 0;
        const mid = sell > 0 ? ((buy + sell) / 2).toFixed(6) : val;
        setRateFormData({ ...rateFormData, buy_rate: val, middle_rate: mid });
    };

    const handleSellRateChange = (val) => {
        const sell = parseFloat(val) || 0;
        const buy = parseFloat(rateFormData.buy_rate) || 0;
        const mid = buy > 0 ? ((buy + sell) / 2).toFixed(6) : val;
        setRateFormData({ ...rateFormData, sell_rate: val, middle_rate: mid });
    };

    const handleConvert = async () => {
        if (!convertFrom || !convertTo || !convertAmount) {
            alert('Lengkapi semua field konversi');
            return;
        }
        try {
            let url = `/api/currencies/convert?from=${convertFrom}&to=${convertTo}&amount=${convertAmount}`;
            if (convertRateTypeId) url += `&rate_type_id=${convertRateTypeId}`;
            if (convertPeriod === 'month') {
                url += `&period=month&year=${convertYear}&month=${convertMonth}`;
            } else {
                url += `&date=${convertDate}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setConvertResult(data.data);
            } else { alert('Error: ' + data.error); }
        } catch (error) { alert('Error: ' + error.message); }
    };

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '-';
        return parseFloat(num).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Master Currency</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" onClick={() => setShowConverter(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        🔄 Kalkulator Kurs
                    </button>
                    <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingCurrency(null); resetForm(); }}>
                        + Tambah Currency
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedCurrency ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                {/* Currency Table */}
                <div className="card">
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>💱 Daftar Mata Uang</h3>
                    </div>
                    {loading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>Memuat data...</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>Kode</th>
                                    <th>Nama</th>
                                    <th style={{ width: '60px', textAlign: 'center' }}>Simbol</th>
                                    <th style={{ width: '60px', textAlign: 'center' }}>Base</th>
                                    <th style={{ width: '60px', textAlign: 'center' }}>Status</th>
                                    <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currencies.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                            Belum ada data currency
                                        </td>
                                    </tr>
                                ) : (
                                    currencies.map((c) => (
                                        <tr key={c.id}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedCurrency && selectedCurrency.id === c.id ? '#eef2ff' : undefined
                                            }}
                                            onClick={() => handleSelectCurrency(c)}>
                                            <td><span className="badge badge-info">{c.code}</span></td>
                                            <td><strong>{c.name}</strong></td>
                                            <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>{c.symbol || '-'}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                {c.is_base === 'Y' ? (
                                                    <span className="badge" style={{
                                                        backgroundColor: '#10b981', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '9999px'
                                                    }}>BASE</span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge" style={{
                                                    backgroundColor: c.active === 'Y' ? '#10b981' : '#ef4444',
                                                    color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '9999px'
                                                }}>{c.active === 'Y' ? 'Aktif' : 'Nonaktif'}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                <button className="btn-icon" onClick={() => handleEdit(c)} title="Edit">✏️</button>
                                                {c.is_base !== 'Y' && (
                                                    <button className="btn-icon" onClick={() => handleDelete(c.id)} title="Hapus">🗑️</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Rate Panel */}
                {selectedCurrency && (
                    <div className="card">
                        <div style={{
                            padding: '1rem', borderBottom: '1px solid #e2e8f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>
                                    📊 Kurs {selectedCurrency.code} ({selectedCurrency.name})
                                </h3>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                    Rate terhadap {currencies.find(c => c.is_base === 'Y')?.code || 'Base Currency'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {selectedCurrency.is_base !== 'Y' && (
                                    <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                        onClick={() => { setShowRateForm(true); setEditingRate(null); resetRateForm(); }}>
                                        + Tambah Kurs
                                    </button>
                                )}
                                <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                                    onClick={() => { setSelectedCurrency(null); setRates([]); }}>
                                    ✕
                                </button>
                            </div>
                        </div>

                        {selectedCurrency.is_base === 'Y' ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🏦</p>
                                <p><strong>{selectedCurrency.code}</strong> adalah Base Currency</p>
                                <p style={{ fontSize: '0.85rem' }}>Semua kurs di-quote terhadap currency ini (rate = 1)</p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Tipe</th>
                                            <th style={{ textAlign: 'right' }}>Kurs Beli</th>
                                            <th style={{ textAlign: 'right' }}>Kurs Jual</th>
                                            <th style={{ textAlign: 'right' }}>Kurs Tengah</th>
                                            <th style={{ textAlign: 'center', width: '80px' }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rates.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                                    Belum ada data kurs
                                                </td>
                                            </tr>
                                        ) : (
                                            rates.map((r) => (
                                                <tr key={r.id}>
                                                    <td><strong>{formatDate(r.rate_date)}</strong></td>
                                                    <td>
                                                        {r.rate_type_code ? (
                                                            <span className="badge" style={{
                                                                backgroundColor: '#6366f1', color: 'white',
                                                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px'
                                                            }}>{r.rate_type_code}</span>
                                                        ) : '-'}
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(r.buy_rate)}</td>
                                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(r.sell_rate)}</td>
                                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb' }}>
                                                        {formatNumber(r.middle_rate)}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button className="btn-icon" onClick={() => handleEditRate(r)} title="Edit">✏️</button>
                                                        <button className="btn-icon" onClick={() => handleDeleteRate(r.id)} title="Hapus">🗑️</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Currency Form Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingCurrency ? 'Edit Currency' : 'Tambah Currency Baru'}</h3>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingCurrency(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Kode Currency</label>
                                    <input type="text" value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="Contoh: USD, EUR" maxLength={10} required />
                                </div>
                                <div className="form-group">
                                    <label>Simbol</label>
                                    <input type="text" value={formData.symbol}
                                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                        placeholder="Contoh: $, €, Rp" maxLength={5} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Nama Currency</label>
                                <input type="text" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: US Dollar, Euro" required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Desimal</label>
                                    <input type="number" value={formData.decimal_places}
                                        onChange={(e) => setFormData({ ...formData, decimal_places: parseInt(e.target.value) || 0 })}
                                        min="0" max="6" />
                                </div>
                                <div className="form-group">
                                    <label>Base Currency</label>
                                    <select value={formData.is_base}
                                        onChange={(e) => setFormData({ ...formData, is_base: e.target.value })}>
                                        <option value="N">Tidak</option>
                                        <option value="Y">Ya (Base)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.value })}>
                                        <option value="Y">Aktif</option>
                                        <option value="N">Nonaktif</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingCurrency ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rate Form Modal */}
            {showRateForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingRate ? 'Edit Kurs' : 'Tambah Kurs Baru'} - {selectedCurrency.code}</h3>
                            <button className="modal-close" onClick={() => { setShowRateForm(false); setEditingRate(null); }}>×</button>
                        </div>
                        <form onSubmit={handleRateSubmit}>
                            <div className="form-group">
                                <label>Tanggal Kurs</label>
                                <input type="date" value={rateFormData.rate_date}
                                    onChange={(e) => setRateFormData({ ...rateFormData, rate_date: e.target.value })}
                                    required />
                            </div>
                            <div className="form-group">
                                <label>Tipe Rate</label>
                                <select value={rateFormData.rate_type_id}
                                    onChange={(e) => setRateFormData({ ...rateFormData, rate_type_id: e.target.value })}>
                                    <option value="">-- Pilih Tipe Rate --</option>
                                    {rateTypes.filter(t => t.active === 'Y').map(t => (
                                        <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Kurs Beli</label>
                                    <input type="number" step="0.000001" value={rateFormData.buy_rate}
                                        onChange={(e) => handleBuyRateChange(e.target.value)}
                                        placeholder="15400.00" required />
                                </div>
                                <div className="form-group">
                                    <label>Kurs Jual</label>
                                    <input type="number" step="0.000001" value={rateFormData.sell_rate}
                                        onChange={(e) => handleSellRateChange(e.target.value)}
                                        placeholder="15600.00" required />
                                </div>
                                <div className="form-group">
                                    <label>Kurs Tengah</label>
                                    <input type="number" step="0.000001" value={rateFormData.middle_rate}
                                        onChange={(e) => setRateFormData({ ...rateFormData, middle_rate: e.target.value })}
                                        placeholder="15500.00" required />
                                </div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem' }}>
                                💡 Kurs tengah otomatis dihitung dari rata-rata kurs beli dan jual
                            </p>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowRateForm(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editingRate ? 'Update' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Converter Modal */}
            {showConverter && (
                <div className="modal-overlay">
                    <div className="modal" style={{ minWidth: '650px', padding: '2rem' }}>
                        <div className="modal-header">
                            <h3>🔄 Kalkulator Konversi Kurs</h3>
                            <button className="modal-close" onClick={() => { setShowConverter(false); setConvertResult(null); }}>×</button>
                        </div>

                        {/* Currency Selection */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'end' }}>
                            <div className="form-group">
                                <label>Dari Currency</label>
                                <select value={convertFrom} onChange={(e) => { setConvertFrom(e.target.value); setConvertResult(null); }}>
                                    <option value="">-- Pilih --</option>
                                    {currencies.filter(c => c.active === 'Y').map(c => (
                                        <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ padding: '0 0 1rem', fontSize: '1.5rem', color: '#64748b' }}>→</div>
                            <div className="form-group">
                                <label>Ke Currency</label>
                                <select value={convertTo} onChange={(e) => { setConvertTo(e.target.value); setConvertResult(null); }}>
                                    <option value="">-- Pilih --</option>
                                    {currencies.filter(c => c.active === 'Y').map(c => (
                                        <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Rate Type & Period */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Tipe Rate</label>
                                <select value={convertRateTypeId} onChange={(e) => { setConvertRateTypeId(e.target.value); setConvertResult(null); }}>
                                    <option value="">Semua Tipe</option>
                                    {rateTypes.filter(t => t.active === 'Y').map(t => (
                                        <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Periode</label>
                                <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
                                    <button type="button" onClick={() => { setConvertPeriod('date'); setConvertResult(null); }}
                                        style={{
                                            flex: 1, padding: '0.5rem', border: 'none', cursor: 'pointer',
                                            backgroundColor: convertPeriod === 'date' ? '#3b82f6' : '#f3f4f6',
                                            color: convertPeriod === 'date' ? 'white' : '#374151',
                                            fontWeight: convertPeriod === 'date' ? 'bold' : 'normal',
                                            fontSize: '0.85rem'
                                        }}>📅 Tanggal</button>
                                    <button type="button" onClick={() => { setConvertPeriod('month'); setConvertResult(null); }}
                                        style={{
                                            flex: 1, padding: '0.5rem', border: 'none', cursor: 'pointer',
                                            borderLeft: '1px solid #d1d5db',
                                            backgroundColor: convertPeriod === 'month' ? '#3b82f6' : '#f3f4f6',
                                            color: convertPeriod === 'month' ? 'white' : '#374151',
                                            fontWeight: convertPeriod === 'month' ? 'bold' : 'normal',
                                            fontSize: '0.85rem'
                                        }}>📆 Bulan</button>
                                </div>
                            </div>
                        </div>

                        {/* Date / Month Selector */}
                        {convertPeriod === 'date' ? (
                            <div className="form-group">
                                <label>Tanggal Kurs</label>
                                <input type="date" value={convertDate}
                                    onChange={(e) => { setConvertDate(e.target.value); setConvertResult(null); }} />
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Tahun</label>
                                    <select value={convertYear} onChange={(e) => { setConvertYear(e.target.value); setConvertResult(null); }}>
                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Bulan</label>
                                    <select value={convertMonth} onChange={(e) => { setConvertMonth(e.target.value); setConvertResult(null); }}>
                                        {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                                            <option key={i + 1} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Amount */}
                        <div className="form-group">
                            <label>Jumlah</label>
                            <input type="number" step="0.01" value={convertAmount}
                                onChange={(e) => { setConvertAmount(e.target.value); setConvertResult(null); }}
                                placeholder="Masukkan jumlah" style={{ fontSize: '1.2rem' }} />
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}
                            onClick={handleConvert}>
                            Konversi
                        </button>

                        {convertResult && (
                            <div style={{
                                marginTop: '1.5rem', padding: '1.5rem', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                                    {formatNumber(convertResult.amount)} {convertResult.from}
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>= </div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                                    {formatNumber(convertResult.result)} {convertResult.to}
                                </div>
                                <div style={{
                                    marginTop: '1rem', fontSize: '0.75rem', opacity: 0.85,
                                    display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                                        <span>Kurs {convertResult.from}: {formatNumber(convertResult.fromRate)}</span>
                                        <span>Kurs {convertResult.to}: {formatNumber(convertResult.toRate)}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', opacity: 0.7, marginTop: '0.3rem' }}>
                                        {(convertResult.fromRateType || convertResult.toRateType) && (
                                            <span>Tipe: {convertResult.fromRateType || convertResult.toRateType}</span>
                                        )}
                                        <span>Tanggal kurs: {formatDate(convertResult.date)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CurrencyList;
