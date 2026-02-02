import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Memuat...</p>
            </div>
        );
    }

    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
