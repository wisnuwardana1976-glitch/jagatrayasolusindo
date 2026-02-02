import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { menuItems } from '../../components/Sidebar'; // Reuse sidebar items as feature list source

const RoleList = () => {
    const { token } = useAuth();
    const [roles, setRoles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [features, setFeatures] = useState([]);

    useEffect(() => {
        fetchRoles();
        // Flatten menu items to get feature list
        const flatFeatures = [];
        menuItems.forEach(section => {
            section.items.forEach(item => {
                flatFeatures.push({ key: item.id, label: item.label, category: section.category });
            });
        });
        setFeatures(flatFeatures);
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await fetch('/api/roles', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setRoles(data.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchRoleDetails = async (id) => {
        try {
            const response = await fetch(`/api/roles/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const role = data.data;

                // Map permissions to state
                const currentPermissions = features.map(f => {
                    const existing = role.permissions.find(p => p.feature_key === f.key);
                    return {
                        feature_key: f.key,
                        can_view: existing ? existing.can_view : 'N',
                        can_create: existing ? existing.can_create : 'N',
                        can_edit: existing ? existing.can_edit : 'N',
                        can_delete: existing ? existing.can_delete : 'N',
                        can_print: existing ? existing.can_print : 'N'
                    };
                });

                setFormData({
                    name: role.name,
                    description: role.description,
                    permissions: currentPermissions
                });
                setEditId(id);
                setIsEditing(true);
                setShowModal(true);
            }
        } catch (error) {
            console.error('Error fetching role details:', error);
        }
    };

    const handlePermissionChange = (featureKey, type, value) => {
        const newPermissions = [...formData.permissions];
        let permIndex = newPermissions.findIndex(p => p.feature_key === featureKey);

        if (permIndex === -1) {
            // Add if not exists
            newPermissions.push({
                feature_key: featureKey,
                can_view: 'N', can_create: 'N', can_edit: 'N', can_delete: 'N', can_print: 'N',
                [type]: value ? 'Y' : 'N'
            });
        } else {
            // Update exist
            newPermissions[permIndex][type] = value ? 'Y' : 'N';
        }
        setFormData({ ...formData, permissions: newPermissions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = isEditing ? `/api/roles/${editId}` : '/api/roles';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                setShowModal(false);
                fetchRoles();
                resetForm();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Error saving role');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus role ini?')) return;
        try {
            const response = await fetch(`/api/roles/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) fetchRoles();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleCreate = () => {
        // Initialize empty permissions
        const initialPermissions = features.map(f => ({
            feature_key: f.key,
            can_view: 'N', can_create: 'N', can_edit: 'N', can_delete: 'N', can_print: 'N'
        }));
        setFormData({ name: '', description: '', permissions: initialPermissions });
        setIsEditing(false);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', permissions: [] });
        setIsEditing(false);
        setEditId(null);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Manajemen Role & Akses</h1>
                <button className="btn btn-primary" onClick={handleCreate}>
                    + Tambah Role
                </button>
            </div>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nama Role</th>
                            <th>Deskripsi</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(role => (
                            <tr key={role.id}>
                                <td><strong>{role.name}</strong></td>
                                <td>{role.description}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" onClick={() => fetchRoleDetails(role.id)}>⚙️ Config</button>
                                        <button className="btn-icon" onClick={() => handleDelete(role.id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '900px' }}>
                        <div className="modal-header">
                            <h3>{isEditing ? 'Konfigurasi Role' : 'Tambah Role Baru'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Nama Role</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Deskripsi</label>
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <h4>Matrix Hak Akses</h4>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee' }}>
                                    <table className="data-table" style={{ fontSize: '0.9rem' }}>
                                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                            <tr>
                                                <th>Fitur / Menu</th>
                                                <th className="text-center">View</th>
                                                <th className="text-center">Create</th>
                                                <th className="text-center">Edit</th>
                                                <th className="text-center">Delete</th>
                                                <th className="text-center">Print</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {features.map((feature, idx) => {
                                                const perm = formData.permissions.find(p => p.feature_key === feature.feature_key) ||
                                                    formData.permissions.find(p => p.feature_key === feature.key); // Fallback lookup

                                                return (
                                                    <tr key={feature.key}>
                                                        <td>
                                                            <small className="text-muted">{feature.category}</small><br />
                                                            {feature.label}
                                                        </td>
                                                        <td className="text-center">
                                                            <input type="checkbox"
                                                                checked={perm?.can_view === 'Y'}
                                                                onChange={e => handlePermissionChange(feature.key, 'can_view', e.target.checked)}
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            <input type="checkbox"
                                                                checked={perm?.can_create === 'Y'}
                                                                onChange={e => handlePermissionChange(feature.key, 'can_create', e.target.checked)}
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            <input type="checkbox"
                                                                checked={perm?.can_edit === 'Y'}
                                                                onChange={e => handlePermissionChange(feature.key, 'can_edit', e.target.checked)}
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            <input type="checkbox"
                                                                checked={perm?.can_delete === 'Y'}
                                                                onChange={e => handlePermissionChange(feature.key, 'can_delete', e.target.checked)}
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            <input type="checkbox"
                                                                checked={perm?.can_print === 'Y'}
                                                                onChange={e => handlePermissionChange(feature.key, 'can_print', e.target.checked)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">Simpan Konfigurasi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleList;
