"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

interface UserDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({ username: "", password: "", fullName: "", email: "", role: "Editor" });
  const [editForm, setEditForm] = useState({ fullName: "", email: "", role: "Editor", isActive: true });
  const [resetForm, setResetForm] = useState({ newPassword: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching users.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormError(null);
    setAddForm({ username: "", password: "", fullName: "", email: "", role: "Editor" });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: UserDto) => {
    setFormError(null);
    setCurrentUser(user);
    setEditForm({ fullName: user.fullName, email: user.email, role: user.role, isActive: user.isActive });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (user: UserDto) => {
    setFormError(null);
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleOpenReset = (user: UserDto) => {
    setFormError(null);
    setCurrentUser(user);
    setResetForm({ newPassword: "" });
    setIsResetModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addForm.password.length < 6) {
      setFormError("Mật khẩu phải dài ít nhất 6 ký tự.");
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      const roleId = addForm.role === "Admin" ? 1 : 2;
      const res = await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: addForm.username,
          password: addForm.password,
          fullName: addForm.fullName,
          email: addForm.email,
          roleId: roleId
        }),
      });
      if (!res.ok) {
        let errMsg = "Đã xảy ra lỗi khi tạo tài khoản.";
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || (errData.errors ? Object.values(errData.errors).flat().join(", ") : "") || errMsg;
        } catch {
          try {
            const txt = await res.text();
            if (txt) errMsg = txt;
          } catch {}
        }
        throw new Error(errMsg);
      }
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await apiFetch(`/api/admin/users/${currentUser.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        let errMsg = "Đã xảy ra lỗi khi cập nhật tài khoản.";
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || (errData.errors ? Object.values(errData.errors).flat().join(", ") : "") || errMsg;
        } catch {
          try {
            const txt = await res.text();
            if (txt) errMsg = txt;
          } catch {}
        }
        throw new Error(errMsg);
      }
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      let res;
      if (currentUser.isActive) {
        // Khóa tài khoản
        res = await apiFetch(`/api/admin/users/${currentUser.id}`, {
          method: "DELETE",
        });
      } else {
        // Mở khóa tài khoản (bằng cách gọi PUT để đặt isActive = true)
        res = await apiFetch(`/api/admin/users/${currentUser.id}`, {
          method: "PUT",
          body: JSON.stringify({
            fullName: currentUser.fullName,
            email: currentUser.email,
            role: currentUser.role,
            isActive: true
          }),
        });
      }
      if (!res.ok) {
        let errMsg = currentUser.isActive ? "Khóa tài khoản thất bại." : "Mở khóa tài khoản thất bại.";
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || (errData.errors ? Object.values(errData.errors).flat().join(", ") : "") || errMsg;
        } catch {
          try {
            const txt = await res.text();
            if (txt) errMsg = txt;
          } catch {}
        }
        throw new Error(errMsg);
      }
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || "Failed to toggle user lock status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (resetForm.newPassword.length < 6) {
      setFormError("Mật khẩu mới phải dài ít nhất 6 ký tự.");
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await apiFetch(`/api/admin/users/${currentUser.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ newPassword: resetForm.newPassword }),
      });
      if (!res.ok) {
        let errMsg = "Đã xảy ra lỗi khi đặt lại mật khẩu.";
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || (errData.errors ? Object.values(errData.errors).flat().join(", ") : "") || errMsg;
        } catch {
          try {
            const txt = await res.text();
            if (txt) errMsg = txt;
          } catch {}
        }
        throw new Error(errMsg);
      }
      setIsResetModalOpen(false);
      alert("Đặt lại mật khẩu thành công!");
    } catch (err: any) {
      setFormError(err.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">User Management</h1>
          <p className="text-gray-400">Manage administrator and editor accounts</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      <div className="glassmorphism rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-800 text-gray-300">
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Username</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Full Name</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Email</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Role</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Status</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce"></div>
                      <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No users found. Create one to get started.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="p-5 text-gray-200 font-medium">
                      {user.username}
                    </td>
                    <td className="p-5 text-gray-300">
                      {user.fullName}
                    </td>
                    <td className="p-5 text-gray-400">
                      {user.email}
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-md text-sm font-mono border ${user.role === 'Admin' ? 'bg-purple-900/20 text-purple-400 border-purple-700' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-5">
                      {user.isActive ? (
                        <span className="px-3 py-1 bg-green-900/20 text-green-400 rounded-md text-sm font-mono border border-green-700/50">Active</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-900/20 text-red-400 rounded-md text-sm font-mono border border-red-700/50">Inactive</span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => handleOpenReset(user)}
                          className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        </button>
                        {user.isActive ? (
                          <button 
                            onClick={() => handleOpenDelete(user)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Khóa tài khoản"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenDelete(user)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-colors"
                            title="Mở khóa tài khoản"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glassmorphism w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">Add New User</h2>
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{formError}</div>
            )}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input required type="text" value={addForm.username} onChange={(e) => setAddForm({...addForm, username: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input required type="password" value={addForm.password} onChange={(e) => setAddForm({...addForm, password: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input required type="text" value={addForm.fullName} onChange={(e) => setAddForm({...addForm, fullName: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input required type="email" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select value={addForm.role} onChange={(e) => setAddForm({...addForm, role: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none">
                  <option value="Editor">Editor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">{isSubmitting ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glassmorphism w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">Edit User</h2>
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{formError}</div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input required type="text" value={editForm.fullName} onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input required type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none">
                  <option value="Editor">Editor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="isActive" checked={editForm.isActive} onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500 focus:ring-2" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-300">Active Account</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">{isSubmitting ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Deactivate Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`glassmorphism w-full max-w-md rounded-2xl border shadow-2xl p-6 animate-in fade-in zoom-in duration-200 ${currentUser?.isActive ? 'border-red-900/50' : 'border-green-900/50'}`}>
            <div className={`flex items-center gap-4 mb-4 ${currentUser?.isActive ? 'text-red-400' : 'text-green-400'}`}>
              <div className={`p-3 rounded-full ${currentUser?.isActive ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                {currentUser?.isActive ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{currentUser?.isActive ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}</h2>
            </div>
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{formError}</div>
            )}
            <div className={`mb-6 p-4 rounded-xl ${currentUser?.isActive ? 'bg-red-900/20 border border-red-800/30' : 'bg-green-900/20 border border-green-800/30'}`}>
              <p className="text-gray-400 text-sm">
                {currentUser?.isActive ? (
                  <>Bạn có chắc chắn muốn khóa tài khoản <span className="text-white font-semibold">{currentUser?.username}</span>? Người dùng này sẽ không thể đăng nhập vào hệ thống.</>
                ) : (
                  <>Bạn có chắc chắn muốn mở khóa tài khoản <span className="text-white font-semibold">{currentUser?.username}</span>? Người dùng này sẽ khôi phục lại khả năng đăng nhập hệ thống.</>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700">Hủy</button>
              <button type="button" onClick={handleDeleteSubmit} disabled={isSubmitting} className={`flex-1 px-4 py-3 rounded-xl text-white font-medium transition-colors shadow-lg ${currentUser?.isActive ? 'bg-red-600 hover:bg-red-500 shadow-red-950/30' : 'bg-green-600 hover:bg-green-500 shadow-green-950/30'}`}>
                {isSubmitting ? (currentUser?.isActive ? "Đang khóa..." : "Đang mở...") : (currentUser?.isActive ? "Đồng ý Khóa" : "Đồng ý Mở khóa")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glassmorphism w-full max-w-md rounded-2xl border border-yellow-900/50 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">Reset Password</h2>
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{formError}</div>
            )}
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <p className="text-sm text-gray-400">Set a new password for <span className="text-white font-semibold">{currentUser?.username}</span>.</p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                <input required type="password" value={resetForm.newPassword} onChange={(e) => setResetForm({...resetForm, newPassword: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsResetModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-800 disabled:opacity-50 text-white font-medium transition-colors shadow-[0_0_15px_rgba(202,138,4,0.3)]">{isSubmitting ? "Resetting..." : "Reset Password"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
