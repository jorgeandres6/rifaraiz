
import React, { useState, useEffect } from 'react';
import { XIcon, LockClosedIcon, Cog6ToothIcon, PhoneIcon, MapPinIcon } from './icons';
import { User } from '../types';
import { Users } from '../services/firestore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaveProfile: (updated: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  onUpdatePassword: (currentPass: string, newPass: string) => boolean;
  onSendVerification?: () => Promise<{ success: boolean; message?: string }>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUser, onSaveProfile, onUpdatePassword, onSendVerification }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [activeTab, setActiveTab] = useState<'password' | 'profile'>('password');

  // Profile fields
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [country, setCountry] = useState(currentUser?.country || '');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'crypto'>(currentUser?.bankAccount ? 'bank' : (currentUser?.cryptoWallet ? 'crypto' : 'bank'));
  // Bank
  const [bankName, setBankName] = useState(currentUser?.bankAccount?.bankName || '');
  const [accountType, setAccountType] = useState<'ahorro' | 'corriente'>(currentUser?.bankAccount?.accountType || 'ahorro');
  const [idNumber, setIdNumber] = useState(currentUser?.bankAccount?.idNumber || '');
  const [accountNumber, setAccountNumber] = useState(currentUser?.bankAccount?.accountNumber || '');
  // Crypto
  const [walletAddress, setWalletAddress] = useState(currentUser?.cryptoWallet?.address || '');
  const [walletNetwork, setWalletNetwork] = useState(currentUser?.cryptoWallet?.network || '');

  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    // Try to fetch the canonical user profile from Firestore when available
    let mounted = true;
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        if (currentUser && import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
          const doc = await Users.get(currentUser.id);
          if (mounted && doc) {
            setName(doc.name || '');
            setPhone(doc.phone || '');
            setCity(doc.city || '');
            setCountry(doc.country || '');
            setPaymentMethod(doc.bankAccount ? 'bank' : (doc.cryptoWallet ? 'crypto' : 'bank'));
            setBankName(doc.bankAccount?.bankName || '');
            setAccountType(doc.bankAccount?.accountType || 'ahorro');
            setIdNumber(doc.bankAccount?.idNumber || '');
            setAccountNumber(doc.bankAccount?.accountNumber || '');
            setWalletAddress(doc.cryptoWallet?.address || '');
            setWalletNetwork(doc.cryptoWallet?.network || '');
          }
        } else {
          // Fallback to currentUser prop
          setName(currentUser?.name || '');
          setPhone(currentUser?.phone || '');
          setCity(currentUser?.city || '');
          setCountry(currentUser?.country || '');
          setPaymentMethod(currentUser?.bankAccount ? 'bank' : (currentUser?.cryptoWallet ? 'crypto' : 'bank'));
          setBankName(currentUser?.bankAccount?.bankName || '');
          setAccountType(currentUser?.bankAccount?.accountType || 'ahorro');
          setIdNumber(currentUser?.bankAccount?.idNumber || '');
          setAccountNumber(currentUser?.bankAccount?.accountNumber || '');
          setWalletAddress(currentUser?.cryptoWallet?.address || '');
          setWalletNetwork(currentUser?.cryptoWallet?.network || '');
        }
      } catch (e) {
        console.error('Error fetching profile from Firestore:', e);
        // keep currentUser-based values as fallback
        setName(currentUser?.name || '');
        setPhone(currentUser?.phone || '');
        setCity(currentUser?.city || '');
        setCountry(currentUser?.country || '');
        setPaymentMethod(currentUser?.bankAccount ? 'bank' : (currentUser?.cryptoWallet ? 'crypto' : 'bank'));
        setBankName(currentUser?.bankAccount?.bankName || '');
        setAccountType(currentUser?.bankAccount?.accountType || 'ahorro');
        setIdNumber(currentUser?.bankAccount?.idNumber || '');
        setAccountNumber(currentUser?.bankAccount?.accountNumber || '');
        setWalletAddress(currentUser?.cryptoWallet?.address || '');
        setWalletNetwork(currentUser?.cryptoWallet?.network || '');
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };

    fetchProfile();
    return () => { mounted = false; };
  }, [currentUser]);

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
        
        {/* Tabs navigation */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex gap-2">
            <button type="button" onClick={() => { setError(''); setSuccess(''); setActiveTab('password'); }} className={`px-3 py-2 text-sm rounded-md ${activeTab === 'password' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
              Contraseña
            </button>
            <button type="button" onClick={() => { setError(''); setSuccess(''); setActiveTab('profile'); }} className={`px-3 py-2 text-sm rounded-md ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
              Perfil
            </button>
          </div>
        </div>

        {/* Password tab */}
        {activeTab === 'password' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
             <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">Cambiar Contraseña</h4>
             
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
        )}

        {/* Profile tab */}
        {activeTab === 'profile' && (
        <div className="p-6 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">Perfil</h4>
            <div className="space-y-3">
                <div>
                    <label className="block text-sm text-gray-300">Nombre</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 text-white" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-300">Teléfono</label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <PhoneIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 pl-10 text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300">Ciudad</label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPinIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input value={city} onChange={(e) => setCity(e.target.value)} className="block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 pl-10 text-white" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-300">País</label>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 text-white" />
                </div>

                <div>
                    <label className="block text-sm text-gray-300">Método de Pago</label>
                    <div className="mt-1 flex gap-4 items-center">
                        <label className="inline-flex items-center gap-2">
                            <input type="radio" name="pm2" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                            <span className="text-sm text-gray-300">Cuenta Bancaria</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="radio" name="pm2" checked={paymentMethod === 'crypto'} onChange={() => setPaymentMethod('crypto')} />
                            <span className="text-sm text-gray-300">Billetera Crypto</span>
                        </label>
                    </div>
                </div>

                {paymentMethod === 'bank' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300">Banco / Cooperativa</label>
                            <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300">Tipo de Cuenta</label>
                            <select value={accountType} onChange={(e) => setAccountType(e.target.value as any)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 text-white">
                                <option value="ahorro">Ahorros</option>
                                <option value="corriente">Corriente</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300">Cédula / RUC</label>
                            <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300">Número de Cuenta</label>
                            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 text-white" />
                        </div>
                    </div>
                )}

                {paymentMethod === 'crypto' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300">Número de Billetera</label>
                            <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300">Red</label>
                            <input value={walletNetwork} onChange={(e) => setWalletNetwork(e.target.value)} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2.5 text-white" />
                        </div>
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">Cancelar</button>
                    <button disabled={profileLoading} onClick={async () => {
                        setError('');
                        setSuccess('');
                        // validation
                        if (!name) { setError('El nombre es requerido.'); return; }
                        if (paymentMethod === 'bank' && (!bankName || !idNumber || !accountNumber)) { setError('Por favor completa los datos bancarios.'); return; }
                        if (paymentMethod === 'crypto' && (!walletAddress || !walletNetwork)) { setError('Por favor completa los datos de billetera.'); return; }

                        const payload: any = {
                            name,
                            phone: phone || null,
                            city: city || null,
                            country: country || null,
                        };
                        if (paymentMethod === 'bank') payload.bankAccount = { bankName, accountType, idNumber, accountNumber };
                        else payload.cryptoWallet = { address: walletAddress, network: walletNetwork };

                        try {
                            const res = await onSaveProfile(payload);
                            if (res.success) {
                                setSuccess('Perfil actualizado.');
                                setTimeout(() => setSuccess(''), 2000);
                            } else {
                                setError(res.message || 'No se pudo actualizar el perfil.');
                                setTimeout(() => setError(''), 4000);
                            }
                        } catch (e) {
                            setError('Error actualizando el perfil.');
                            setTimeout(() => setError(''), 4000);
                        }
                    }} className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors ${profileLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        {profileLoading ? 'Cargando...' : 'Guardar Perfil'}
                    </button>
                </div>
            </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
