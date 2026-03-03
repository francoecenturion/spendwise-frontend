import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/api';
import { uploadToCloudinary } from '../services/cloudinary';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [surname, setSurname] = useState(user?.surname ?? '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setProfilePicture(url);
    } catch (err: any) {
      setError(err.message ?? 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) { setError('Ingresá tu contraseña actual'); return; }
      if (newPassword.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres'); return; }
      if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    }
    setSaving(true);
    try {
      await profileService.updateProfile({
        name,
        surname,
        profilePicture,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      updateUser({ name, surname, profilePicture });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail ?? err.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await profileService.deleteAccount();
      logout();
    } catch (err: any) {
      setError(err.response?.data?.detail ?? err.message ?? 'Error al eliminar la cuenta');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Mi perfil</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile picture */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {profilePicture ? (
              <img src={profilePicture} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">Hacé clic en la foto para cambiarla</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Apellido</label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Email</label>
            <input
              type="text"
              value={user?.email ?? ''}
              disabled
              className="input-field opacity-60 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Password change */}
        <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowPasswordSection(!showPasswordSection);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
            className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            {showPasswordSection ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
          </button>
          {showPasswordSection && (
            <div className="space-y-3 mt-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Contraseña actual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="btn btn-primary flex-1"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>

        {/* Delete account */}
        <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-sm text-red-600 dark:text-red-400 hover:underline text-center"
            >
              Eliminar cuenta
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-stone-700 dark:text-stone-300 text-center">
                ¿Estás seguro? Esta acción desactivará tu cuenta.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary flex-1 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="btn btn-danger flex-1 text-sm"
                >
                  {deleting ? 'Eliminando…' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
