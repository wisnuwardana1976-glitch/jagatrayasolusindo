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
                Fitur ini akan menghitung ulang jumlah stok di setiap gudang dan biaya rata-rata (Average Cost) item
                berdasarkan seluruh riwayat transaksi Pembelian (Receiving) dan Penjualan (Shipment).
            </p>

            <div className="alert alert-warning mb-4">
                <strong>Perhatian:</strong> Proses ini mungkin memakan waktu tergantung jumlah transaksi.
                Pastikan tidak ada transaksi yang sedang berlangsung saat proses ini dijalankan.
            </div>

            <button
                className="btn btn-primary"
                onClick={handleRecalculate}
                disabled={loading}
            >
                {loading ? 'Sedang Memproses...' : 'Mulai Hitung Ulang'}
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
