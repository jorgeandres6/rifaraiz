
import React, { useState } from 'react';
import { XIcon, LockClosedIcon, Cog6ToothIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePassword: (currentPass: string, newPass: string) => boolean;
  onSendVerification?: () => Promise<{ success: boolean; message?: string }>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onUpdatePassword, onSendVerification }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('La nueva contraseña no puede ser igual a la anterior.');
      return;
    }

    const updated = onUpdatePassword(currentPassword, newPassword);
    
    if (updated) {
      setSuccess('¡Contraseña actualizada exitosamente!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
          onClose();
          setSuccess('');
      }, 1500);
    } else {
      setError('La contraseña actual es incorrecta.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md relative transform transition-all border border-gray-600" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-full">
                    <Cog6ToothIcon className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Configuración</h3>
                    <p className="text-xs text-gray-400">Administra tu cuenta</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <XIcon className="h-6 w-6" />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
             <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2 border-b border-gray-700 pb-2">Cambiar Contraseña</h4>
             
             <div>
                <label htmlFor="currentPass" className="block text-sm font-medium text-gray-300">Contraseña Actual</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <input 
                        type="password" 
                        id="currentPass" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 pl-10 focus:ring-indigo-500 focus:border-indigo-500 text-white" 
                        placeholder="••••••••" 
                    />
                </div>
            </div>

            <div>
                <label htmlFor="newPass" className="block text-sm font-medium text-gray-300">Nueva Contraseña</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <input 
                        type="password" 
                        id="newPass" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 pl-10 focus:ring-indigo-500 focus:border-indigo-500 text-white" 
                        placeholder="Mínimo 6 caracteres" 
                    />
                </div>
            </div>

            <div>
                <label htmlFor="confirmPass" className="block text-sm font-medium text-gray-300">Confirmar Nueva Contraseña</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <input 
                        type="password" 
                        id="confirmPass" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 pl-10 focus:ring-indigo-500 focus:border-indigo-500 text-white" 
                        placeholder="Repite la contraseña" 
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-3 bg-green-500/20 border border-green-500/50 rounded text-green-300 text-sm font-semibold text-center">
                    {success}
                </div>
            )}

            <div className="pt-4 flex justify-between items-center">
                <div>
                    <button
                        type="button"
                        onClick={async () => {
                            if (!onSendVerification) return;
                            setSendingVerification(true);
                            setError('');
                            const res = await onSendVerification();
                            setSendingVerification(false);
                            if (res.success) {
                                setSuccess('Correo de verificación enviado. Revisa tu buzón.');
                                setTimeout(() => setSuccess(''), 4000);
                            } else {
                                setError(res.message || 'No se pudo enviar el correo de verificación.');
                                setTimeout(() => setError(''), 4000);
                            }
                        }}
                        disabled={sendingVerification}
                        className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition-colors mr-4"
                    >
                        {sendingVerification ? 'Enviando...' : 'Reenviar verificación'}
                    </button>
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                        Actualizar Contraseña
                    </button>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
