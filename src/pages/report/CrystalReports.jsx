import React, { useState, useEffect } from 'react';

function CrystalReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        report_code: '',
        module: '',
        category: '',
        report_type: 'TKPI',
        name: '',
        file_name: ''
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/reports/definitions');
            const result = await response.json();
            if (result.success) {
                setReports(result.data);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Gagal mengambil daftar laporan');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (id) => {
        setSelectedId(id);
    };

    const handlePrint = async () => {
        if (!selectedId) return;

        const report = reports.find(r => r.id === selectedId);
        if (!report) return;

        setProcessing(true);
        try {
            const response = await fetch('http://localhost:3001/api/crystal-reports/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: report.file_name }),
            });
            const result = await response.json();

            if (result.success) {
                alert(`Berhasil membuka laporan: ${report.name}`);
            } else {
                alert(`Gagal membuka laporan: ${result.error}`);
            }
        } catch (err) {
            alert('Terjadi kesalahan saat membuka laporan.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        if (!confirm('Apakah anda yakin ingin menghapus laporan ini?')) return;

        setProcessing(true);
        try {
            const response = await fetch(`http://localhost:3001/api/reports/definitions/${selectedId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                fetchReports();
                setSelectedId(null);
            } else {
                alert('Gagal menghapus laporan: ' + result.error);
            }
        } catch (err) {
            alert('Terjadi kesalahan saat menghapus laporan.');
        } finally {
            setProcessing(false);
        }
    };

    const handleInsert = () => {
        setFormData({
            report_code: '',
            module: '',
            category: '',
            report_type: 'TKPI',
            name: '',
            file_name: ''
        });
        setIsCreating(true);
    };

    const handleChange = () => {
        if (!selectedId) return;
        const report = reports.find(r => r.id === selectedId);
        setFormData({ ...report });
        setIsEditing(true);
    };

    const handleSave = async () => {
        setProcessing(true);
        try {
            const url = isCreating
                ? 'http://localhost:3001/api/reports/definitions'
                : `http://localhost:3001/api/reports/definitions/${formData.id}`;

            const method = isCreating ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.success) {
                fetchReports();
                setIsCreating(false);
                setIsEditing(false);
            } else {
                alert('Gagal menyimpan laporan: ' + result.error);
            }
        } catch (err) {
            alert('Terjadi kesalahan saat menyimpan laporan.');
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        setIsCreating(false);
        setIsEditing(false);
    };

    // --- Inline Styles for Robustness ---
    const containerStyle = {
        padding: '2rem',
        width: '100%',
        minHeight: '100vh',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        boxSizing: 'border-box'
    };

    const headerStyle = {
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '1rem'
    };

    const titleStyle = {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#1f2937'
    };

    const contentBoxStyle = {
        backgroundColor: '#fff',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        width: '100%'
    };

    const tabButtonStyle = {
        backgroundColor: '#2563eb', // blue-600
        color: 'white',
        padding: '0.75rem 2rem',
        borderTopLeftRadius: '0.5rem',
        borderTopRightRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 'bold',
        border: 'none',
        cursor: 'pointer',
        marginRight: '4px',
        marginBottom: '-1px', // Pull down to cover border
        position: 'relative',
        zIndex: 10
    };

    const tabContainerStyle = {
        display: 'flex',
        borderBottom: '2px solid #2563eb', // blue-600
        marginBottom: '1.5rem',
        width: '100%'
    };

    const tableContainerStyle = {
        width: '100%',
        overflowX: 'auto',
        marginBottom: '2rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.875rem',
        textAlign: 'left'
    };

    const thStyle = {
        padding: '1rem', // spacious padding
        backgroundColor: '#f9fafb',
        color: '#6b7280',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '0.75rem',
        borderBottom: '1px solid #e5e7eb'
    };

    const tdStyle = {
        padding: '1rem', // spacious padding
        borderBottom: '1px solid #f3f4f6',
        color: '#111827'
    };

    // Button Styles
    const btnStyle = (bgColor, textColor, borderColor) => ({
        padding: '0.5rem 1.5rem',
        borderRadius: '0.25rem',
        fontWeight: 'bold',
        fontSize: '0.875rem',
        color: textColor,
        backgroundColor: bgColor,
        borderBottom: `4px solid ${borderColor}`,
        borderRight: `2px solid ${borderColor}`,
        borderTop: '1px solid ' + borderColor, // Added light border top for full button definition
        borderLeft: '1px solid ' + borderColor,
        cursor: 'pointer',
        boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        marginRight: '0.75rem',
        marginBottom: '0.5rem',
        transition: 'all 0.1s'
    });

    // Helper to merge styles for disabled state
    const getBtnStyle = (type, disabled, isModal = false) => {
        let base = {};
        if (disabled) {
            base = {
                ...btnStyle('#d1d5db', '#9ca3af', '#9ca3af'), // gray-300
                borderBottom: '1px solid #9ca3af', // remove 3d effect
                borderRight: '1px solid #9ca3af',
                transform: 'none',
                cursor: 'not-allowed',
                boxShadow: 'none'
            };
        } else {
            if (type === 'primary') base = btnStyle('#2563eb', 'white', '#1e40af'); // blue-600, blue-800
            else if (type === 'secondary') base = btnStyle('#f3f4f6', '#374151', '#d1d5db'); // gray-100, gray-700, gray-300
            else if (type === 'danger') base = btnStyle('#b91c1c', 'white', '#7f1d1d');
        }

        if (isModal) {
            base.marginRight = '0'; // Handle gap via container in modal
            base.marginBottom = '0';
        }
        return base;
    };

    // Modal Styles
    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
    };

    const modalContentStyle = {
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '800px', // Wider modal
        padding: '0', // Padding handled by children
        borderTop: '0.5rem solid #2563eb', // blue top border
        overflow: 'hidden'
    };

    const modalHeaderStyle = {
        padding: '1.5rem 2rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    };

    const modalBodyStyle = {
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem' // Spacious gap
    };

    const formGroupStyle = {
        marginBottom: '0.5rem',
        display: 'flex',
        flexDirection: 'column'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '700',
        color: '#374151',
        marginBottom: '0.5rem'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem', // Taller inputs
        borderRadius: '0.375rem',
        border: '1px solid #d1d5db',
        boxShadow: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        fontSize: '1rem', // Detailed text
        boxSizing: 'border-box'
    };

    const modalFooterStyle = {
        padding: '1.5rem 2rem',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem' // Space between buttons
    };

    if (loading) return <div style={{ padding: '2rem' }}>Memuat data...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

    // Modal Render
    if (isCreating || isEditing) {
        return (
            <div style={modalOverlayStyle}>
                <div style={modalContentStyle}>
                    <div style={modalHeaderStyle}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                            {isCreating ? 'Insert New Report' : 'Change Report Data'}
                        </h2>
                        <button
                            onClick={handleCancel}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9ca3af' }}
                        >
                            &times;
                        </button>
                    </div>

                    <div style={modalBodyStyle}>
                        {/* Left Column */}
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>Report ID</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={formData.report_code}
                                onChange={e => setFormData({ ...formData, report_code: e.target.value })}
                                placeholder="e.g. 200001"
                            />
                        </div>
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>Module ID</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={formData.module}
                                onChange={e => setFormData({ ...formData, module: e.target.value })}
                                placeholder="e.g. AP"
                            />
                        </div>
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>Group</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g. AP*"
                            />
                        </div>
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>Type</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={formData.report_type}
                                onChange={e => setFormData({ ...formData, report_type: e.target.value })}
                                placeholder="e.g. TKPI"
                            />
                        </div>

                        {/* Full Width Fields */}
                        <div style={{ ...formGroupStyle, gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Report Name</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter report name"
                            />
                        </div>
                        <div style={{ ...formGroupStyle, gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Crystal File (.rpt)</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={formData.file_name}
                                onChange={e => setFormData({ ...formData, file_name: e.target.value })}
                                placeholder="filename.rpt"
                            />
                            <small style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.75rem' }}>
                                Ensure this file exists in the server report directory.
                            </small>
                        </div>
                    </div>

                    <div style={modalFooterStyle}>
                        <button onClick={handleCancel} style={getBtnStyle('secondary', false, true)}>Cancel</button>
                        <button onClick={handleSave} disabled={processing} style={getBtnStyle('primary', processing, true)}>
                            {processing ? 'Saving...' : 'Save Data'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Page Render
    return (
        <div style={containerStyle}>
            {/* Header / Title Bar */}
            <div style={headerStyle}>
                <h1 style={titleStyle}>Standard Report</h1>
            </div>

            {/* Content Box */}
            <div style={contentBoxStyle}>
                {/* Tabs */}
                <div style={tabContainerStyle}>
                    <button style={tabButtonStyle}>General</button>
                    <div style={{ flexGrow: 1 }}></div>
                </div>

                {/* Table Container */}
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: '50px', textAlign: 'center' }}></th>
                                <th style={thStyle}>Report ID</th>
                                <th style={thStyle}>Module ID</th>
                                <th style={thStyle}>Group</th>
                                <th style={thStyle}>Type</th>
                                <th style={{ ...thStyle, width: '30%' }}>Report Name</th>
                                <th style={thStyle}>Crystal File</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr
                                    key={report.id}
                                    onClick={() => handleSelect(report.id)}
                                    style={{
                                        backgroundColor: selectedId === report.id ? '#eff6ff' : 'white', // blue-50
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => { if (selectedId !== report.id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                                    onMouseLeave={(e) => { if (selectedId !== report.id) e.currentTarget.style.backgroundColor = 'white'; }}
                                >
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <input
                                            type="radio"
                                            checked={selectedId === report.id}
                                            onChange={() => handleSelect(report.id)}
                                            style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                                        />
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: '600' }}>{report.report_code}</td>
                                    <td style={tdStyle}>{report.module}</td>
                                    <td style={tdStyle}>{report.category}</td>
                                    <td style={tdStyle}>{report.report_type}</td>
                                    <td style={{ ...tdStyle, color: '#1f2937' }}>{report.name}</td>
                                    <td style={{ ...tdStyle, color: '#6b7280', fontStyle: 'italic' }}>{report.file_name}</td>
                                </tr>
                            ))}
                            {reports.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                                        Tidak ada data laporan ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Buttons Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    {/* Row 1: CRUD */}
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        <button onClick={handleInsert} style={getBtnStyle('primary', false)}>Insert</button>
                        <button onClick={handleChange} disabled={!selectedId} style={getBtnStyle('primary', !selectedId)}>Change</button>
                        <button onClick={handleDelete} disabled={!selectedId} style={getBtnStyle('primary', !selectedId)}>Delete</button>
                    </div>

                    {/* Row 2: Actions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        <button style={getBtnStyle('secondary', false)}>Preview</button>
                        <button onClick={handlePrint} disabled={!selectedId} style={getBtnStyle('primary', !selectedId)}>Print</button>
                        <button style={getBtnStyle('secondary', false)}>Export to PDF</button>
                        <button style={getBtnStyle('secondary', false)}>User</button>
                    </div>

                    {/* Row 3: Admin / Access */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem', alignItems: 'center' }}>
                        <div style={{ flexGrow: 1 }}></div>
                        <button style={getBtnStyle('primary', false)}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CrystalReports;
