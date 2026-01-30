import React, { useState, useEffect } from 'react';

function JasperReports() {
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

    // Parameter Modal State
    const [showParamModal, setShowParamModal] = useState(false);
    const [reportParams, setReportParams] = useState({
        startDate: '',
        endDate: ''
    });

    // PDF Preview State
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);

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

    // Step 1: Show parameter modal when Print is clicked
    const handlePrint = () => {
        if (!selectedId) return;

        // Set default date range (current month)
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        setReportParams({
            startDate: firstDay.toISOString().split('T')[0],
            endDate: lastDay.toISOString().split('T')[0]
        });
        setShowParamModal(true);
    };

    // Step 2: Generate PDF after parameters are submitted
    const handleGenerateReport = async () => {
        if (!selectedId) return;

        const report = reports.find(r => r.id === selectedId);
        if (!report) return;

        setProcessing(true);
        setShowParamModal(false);

        try {
            // Build PDF URL with query parameters
            const params = new URLSearchParams({
                filename: report.file_name,
                startDate: reportParams.startDate,
                endDate: reportParams.endDate
            });

            // Set URL for preview in iframe modal
            const pdfUrlStr = `http://localhost:3001/api/reports/pdf?${params.toString()}`;
            setPdfUrl(pdfUrlStr);
            setShowPdfPreview(true);

        } catch (err) {
            alert(`Terjadi kesalahan: ${err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleClosePdfPreview = () => {
        setShowPdfPreview(false);
        setPdfUrl(null);
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

    // --- Inline Styles ---
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
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '0.75rem 2rem',
        borderTopLeftRadius: '0.5rem',
        borderTopRightRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 'bold',
        border: 'none',
        cursor: 'pointer',
        marginRight: '4px',
        marginBottom: '-1px',
        position: 'relative',
        zIndex: 10
    };

    const tabContainerStyle = {
        display: 'flex',
        borderBottom: '2px solid #2563eb',
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
        padding: '1rem',
        backgroundColor: '#f9fafb',
        color: '#6b7280',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: '0.75rem',
        borderBottom: '1px solid #e5e7eb'
    };

    const tdStyle = {
        padding: '1rem',
        borderBottom: '1px solid #f3f4f6',
        color: '#111827'
    };

    const btnStyle = (bgColor, textColor, borderColor) => ({
        padding: '0.5rem 1.5rem',
        borderRadius: '0.25rem',
        fontWeight: 'bold',
        fontSize: '0.875rem',
        color: textColor,
        backgroundColor: bgColor,
        borderBottom: `4px solid ${borderColor}`,
        borderRight: `2px solid ${borderColor}`,
        borderTop: '1px solid ' + borderColor,
        borderLeft: '1px solid ' + borderColor,
        cursor: 'pointer',
        boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        marginRight: '0.75rem',
        marginBottom: '0.5rem',
        transition: 'all 0.1s'
    });

    const getBtnStyle = (type, disabled, isModal = false) => {
        let base = {};
        if (disabled) {
            base = {
                ...btnStyle('#d1d5db', '#9ca3af', '#9ca3af'),
                borderBottom: '1px solid #9ca3af',
                borderRight: '1px solid #9ca3af',
                transform: 'none',
                cursor: 'not-allowed',
                boxShadow: 'none'
            };
        } else {
            if (type === 'primary') base = btnStyle('#2563eb', 'white', '#1e40af');
            else if (type === 'secondary') base = btnStyle('#f3f4f6', '#374151', '#d1d5db');
            else if (type === 'danger') base = btnStyle('#b91c1c', 'white', '#7f1d1d');
        }

        if (isModal) {
            base.marginRight = '0';
            base.marginBottom = '0';
        }
        return base;
    };

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
        maxWidth: '800px',
        padding: '0',
        borderTop: '0.5rem solid #2563eb',
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
        gap: '2rem'
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
        padding: '0.75rem',
        borderRadius: '0.375rem',
        border: '1px solid #d1d5db',
        boxShadow: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        fontSize: '1rem',
        boxSizing: 'border-box'
    };

    const modalFooterStyle = {
        padding: '1.5rem 2rem',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem'
    };

    // PDF Preview Modal Styles
    const pdfModalStyle = {
        ...modalContentStyle,
        maxWidth: '95vw',
        maxHeight: '95vh',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column'
    };

    const pdfIframeStyle = {
        flex: 1,
        width: '100%',
        border: 'none'
    };

    if (loading) return <div style={{ padding: '2rem' }}>Memuat data...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

    // Parameter Modal Render
    if (showParamModal) {
        const selectedReport = reports.find(r => r.id === selectedId);
        return (
            <div style={modalOverlayStyle}>
                <div style={{ ...modalContentStyle, maxWidth: '500px' }}>
                    <div style={modalHeaderStyle}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                            Parameter Laporan
                        </h2>
                        <button
                            onClick={() => setShowParamModal(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9ca3af' }}
                        >
                            &times;
                        </button>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                            <strong>Report:</strong> {selectedReport?.name}
                        </p>

                        <div style={formGroupStyle}>
                            <label style={labelStyle}>Tanggal Mulai (Start Date)</label>
                            <input
                                type="date"
                                style={inputStyle}
                                value={reportParams.startDate}
                                onChange={e => setReportParams({ ...reportParams, startDate: e.target.value })}
                            />
                        </div>

                        <div style={{ ...formGroupStyle, marginTop: '1rem' }}>
                            <label style={labelStyle}>Tanggal Akhir (End Date)</label>
                            <input
                                type="date"
                                style={inputStyle}
                                value={reportParams.endDate}
                                onChange={e => setReportParams({ ...reportParams, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={modalFooterStyle}>
                        <button onClick={() => setShowParamModal(false)} style={getBtnStyle('secondary', false, true)}>
                            Batal
                        </button>
                        <button
                            onClick={handleGenerateReport}
                            disabled={!reportParams.startDate || !reportParams.endDate}
                            style={getBtnStyle('primary', !reportParams.startDate || !reportParams.endDate, true)}
                        >
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // PDF Preview Modal Render
    if (showPdfPreview && pdfUrl) {
        return (
            <div style={modalOverlayStyle}>
                <div style={{ ...modalContentStyle, maxWidth: '500px' }}>
                    <div style={modalHeaderStyle}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                            Laporan Siap
                        </h2>
                        <button
                            onClick={handleClosePdfPreview}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9ca3af' }}
                        >
                            &times;
                        </button>
                    </div>
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <svg style={{ width: '64px', height: '64px', margin: '0 auto', color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p style={{ marginTop: '1rem', fontSize: '1rem', color: '#374151' }}>
                                PDF laporan berhasil dibuat!
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    ...getBtnStyle('primary', false, true),
                                    textDecoration: 'none',
                                    display: 'block',
                                    textAlign: 'center',
                                    padding: '1rem'
                                }}
                            >
                                📄 Lihat PDF
                            </a>
                            <a
                                href={pdfUrl}
                                download="laporan.pdf"
                                style={{
                                    ...getBtnStyle('secondary', false, true),
                                    textDecoration: 'none',
                                    display: 'block',
                                    textAlign: 'center',
                                    padding: '1rem'
                                }}
                            >
                                ⬇️ Download PDF
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Edit/Create Form Modal Render
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
                            <label style={labelStyle}>Report File (.jrxml)</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={formData.file_name}
                                onChange={e => setFormData({ ...formData, file_name: e.target.value })}
                                placeholder="filename.jrxml"
                            />
                            <small style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.75rem' }}>
                                Pastikan file ada di folder Report pada server.
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
            <div style={headerStyle}>
                <h1 style={titleStyle}>Standard Report</h1>
            </div>

            <div style={contentBoxStyle}>
                <div style={tabContainerStyle}>
                    <button style={tabButtonStyle}>General</button>
                    <div style={{ flexGrow: 1 }}></div>
                </div>

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
                                <th style={thStyle}>Report File</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr
                                    key={report.id}
                                    onClick={() => handleSelect(report.id)}
                                    style={{
                                        backgroundColor: selectedId === report.id ? '#eff6ff' : 'white',
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        <button onClick={handleInsert} style={getBtnStyle('primary', false)}>Insert</button>
                        <button onClick={handleChange} disabled={!selectedId} style={getBtnStyle('primary', !selectedId)}>Change</button>
                        <button onClick={handleDelete} disabled={!selectedId} style={getBtnStyle('primary', !selectedId)}>Delete</button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        <button onClick={handlePrint} disabled={!selectedId || processing} style={getBtnStyle('primary', !selectedId || processing)}>
                            {processing ? 'Processing...' : 'Print'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem', alignItems: 'center' }}>
                        <div style={{ flexGrow: 1 }}></div>
                        <button style={getBtnStyle('primary', false)}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JasperReports;
