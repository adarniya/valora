import React, { useEffect, useState } from 'react';
import { Shield, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

const PermissionManager = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [toast, setToast] = useState(null);
  const [localPerms, setLocalPerms] = useState({});

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/permissions');
      if (res.data.success) {
        setData(res.data.data);
        const map = {};
        res.data.data.roles.forEach(role => {
          map[role.role_id] = new Set(
            role.permissions.filter(p => p.granted).map(p => p.permission_id)
          );
        });
        setLocalPerms(map);
      }
    } catch (err) {
      showToast('Failed to load permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (role_id, permission_id) => {
    if (role_id === 1) return;
    setLocalPerms(prev => {
      const next = { ...prev, [role_id]: new Set(prev[role_id]) };
      if (next[role_id].has(permission_id)) {
        next[role_id].delete(permission_id);
      } else {
        next[role_id].add(permission_id);
      }
      return next;
    });
  };

  const saveRole = async (role_id) => {
    setSaving(role_id);
    try {
      const permission_ids = [...(localPerms[role_id] || [])];
      const res = await api.put(`/permissions/role/${role_id}`, { permission_ids });
      if (res.data.success) {
        showToast('Permissions saved!', 'success');
      } else {
        showToast(res.data.message, 'error');
      }
    } catch (err) {
      showToast('Save failed', 'error');
    } finally {
      setSaving(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
    </div>
  );

  const editableRoles = data?.roles?.filter(r => r.role_id !== 1) || [];
  const permissions = data?.permissions || [];

  return (
    <div className="p-6 max-w-full">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permission Manager</h1>
          <p className="text-sm text-gray-500">Super Admin locked. Toggle permissions per role then save.</p>
        </div>
      </div>

      <div className="space-y-6">
        {editableRoles.map(role => {
          const granted = localPerms[role.role_id] || new Set();
          const grantedCount = granted.size;
          const isSaving = saving === role.role_id;

          return (
            <div key={role.role_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {role.role_name}
                  </span>
                  <span className="text-xs text-gray-400">{grantedCount} / {permissions.length} permissions</span>
                </div>
                <button
                  onClick={() => saveRole(role.role_id)}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>

              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {permissions.map(perm => {
                  const active = granted.has(perm.permission_id);
                  return (
                    <button
                      key={perm.permission_id}
                      onClick={() => toggle(role.role_id, perm.permission_id)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        active
                          ? 'bg-green-50 border-green-400 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <span className="block truncate">{perm.permission_name.replace(/_/g, ' ')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionManager;