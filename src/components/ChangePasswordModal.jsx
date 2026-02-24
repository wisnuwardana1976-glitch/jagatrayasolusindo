
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError("Password baru dan konfirmasi tidak cocok.");
            return;
        }

        if (newPassword.length < 5) { // Basic validation
            setError("Password baru minimal 5 karakter.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess("Password berhasil diubah!");
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => {
                    onClose();
                    setSuccess(null);
                }, 1500);
            } else {
                setError(data.error || "Gagal mengubah password.");
            }
        } catch (err) {
            setError("Terjadi kesalahan koneksi.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#2d3748',
                padding: '2rem',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '400px',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#e2e8f0' }}>Ganti Password</h2>

                {error && (
                    <div style={{ backgroundColor: '#fed7d7', color: '#c53030', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{ backgroundColor: '#c6f6d5', color: '#2f855a', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cbd5e0' }}>Password Saat Ini</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #4a5568',
                                backgroundColor: '#1a202c',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cbd5e0' }}>Password Baru</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #4a5568',
                                backgroundColor: '#1a202c',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cbd5e0' }}>Konfirmasi Password Baru</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #4a5568',
                                backgroundColor: '#1a202c',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: '#4a5568',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: '#3182ce',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
