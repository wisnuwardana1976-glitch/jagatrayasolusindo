import { useState } from 'react';

function RecalculateInventory() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleRecalculate = async () => {
        if (!confirm('Proses ini akan menghitung ulang stok dan HPP berdasarkan semua history transaksi. Lanjutkan?')) return;

        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetch('/api/inventory/recalculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            const data = await response.json();

            if (data.success) {
                setResult(data.message);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2 className="title">Recalculate Inventory</h2>
            <p className="mb-4">
                Fitur ini akan menghapus stok saat ini dan membangun ulang <strong>dari nol</strong> berdasarkan seluruh riwayat transaksi:
                <ul className="list-disc ml-5 mt-2">
                    <li>Penerimaan Barang (Receivings)</li>
                    <li>Pengiriman Barang (Shipments)</li>
                    <li>Penyesuaian Stok (Adjustments)</li>
                    <li>Transfer Stok</li>
                    <li>Konversi Item</li>
                </ul>
                <br />
                Proses ini akan memperbaiki jumlah stok dan perhitungan HPP (Average Cost).
            </p>

            <div className="alert alert-warning mb-4">
                <strong>Perhatian:</strong> Proses ini mungkin memakan waktu lama.
                Pastikan tidak ada transaksi yang sedang berlangsung.
            </div>

            <button
                className="btn btn-primary"
                onClick={handleRecalculate}
                disabled={loading}
            >
                {loading ? 'Sedang Memproses...' : 'Mulai Hitung Ulang (Fix All)'}
            </button>

            {result && (
                <div className="alert alert-success mt-4">
                    <strong>Sukses!</strong> {result}
                </div>
            )}

            {error && (
                <div className="alert alert-danger mt-4">
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    );
}

export default RecalculateInventory;
