import React, { useState } from 'react';
import { UserPrize, User } from '../types';
import { XIcon, CheckCircleIcon } from './icons';

interface AdminPrizeRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPrizes: UserPrize[];
  users?: User[];
  currentUser: User;
  onRedeemPrize: (prizeId: string, code: string, adminId: string) => boolean;
}

const AdminPrizeRedemptionModal: React.FC<AdminPrizeRedemptionModalProps> = ({
  isOpen,
  onClose,
  userPrizes,
  users = [],
  currentUser,
  onRedeemPrize,
}) => {
  const [code, setCode] = useState<string>('');
  const [foundPrize, setFoundPrize] = useState<UserPrize | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen) return null;

  const unredeemed = userPrizes.filter(p => !p.redeemed);
  
  // Function to get username from users array
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || `Usuario ${userId.slice(0, 6)}`;
  };

  const handleSearchCode = () => {
    setMessage(null);
    setFoundPrize(null);

    if (!code.trim()) {
      setMessage({ text: 'Por favor ingresa un código', type: 'error' });
      return;
    }

    // First try to find in unredeemed
    const prize = unredeemed.find(p => p.code.toUpperCase() === code.toUpperCase());
    
    if (prize) {
      setFoundPrize(prize);
      setMessage({ text: 'Premio encontrado. Confirma para canjear', type: 'info' });
      return;
    }

    // Check if it was already redeemed
    const redeemedPrize = userPrizes.find(p => p.redeemed && p.code.toUpperCase() === code.toUpperCase());
    
    if (redeemedPrize) {
      setFoundPrize(redeemedPrize);
      const redeemedBy = redeemedPrize.redeemedByAdminId ? getUserName(redeemedPrize.redeemedByAdminId) : 'Desconocido';
      const redeemedDate = redeemedPrize.redeemedDate ? new Date(redeemedPrize.redeemedDate).toLocaleDateString('es-ES') : 'Desconocida';
      setMessage({ text: `Este premio ya fue canjeado el ${redeemedDate} por ${redeemedBy}`, type: 'error' });
      return;
    }
    
    setMessage({ text: 'No se encontró ningún premio con este código', type: 'error' });
  };

  const handleRedeem = () => {
    if (!foundPrize || !code) {
      setMessage({ text: 'Busca un premio primero', type: 'error' });
      return;
    }

    const success = onRedeemPrize(foundPrize.id, code, currentUser.id);
    if (success) {
      setMessage({ text: 'Premio canjeado exitosamente', type: 'success' });
      setCode('');
      setFoundPrize(null);
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } else {
      setMessage({ text: 'Error al canjear el premio. Verifica el código', type: 'error' });
    }
  };

  const handleReset = () => {
    setCode('');
    setFoundPrize(null);
    setMessage(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Canjear Premio</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        {unredeemed.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No hay premios sin canjear</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código de canje
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchCode()}
                  placeholder="Ingresa el código (ej: ABC123XY)"
                  disabled={!!foundPrize}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={foundPrize ? handleReset : handleSearchCode}
                  className={`px-4 py-2 font-medium rounded transition-colors ${
                    foundPrize
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {foundPrize ? 'Limpiar' : 'Buscar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total de premios sin canjear: {unredeemed.length}
              </p>
            </div>

            {/* Prize Details */}
            {foundPrize && (
              <div className="bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border border-yellow-500/30 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <CheckCircleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <h3 className="text-yellow-400 font-bold">Premio Encontrado</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-yellow-400">Premio:</span> {foundPrize.prizeName}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-yellow-400">Usuario:</span> {getUserName(foundPrize.userId)}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-yellow-400">Ganado:</span>{' '}
                    {new Date(foundPrize.dateWon).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-yellow-400">Código:</span>{' '}
                    <span className="font-mono text-yellow-300">{foundPrize.code}</span>
                  </p>
                  {foundPrize.redeemed && foundPrize.redeemedByAdminId && (
                    <div className="mt-3 pt-3 border-t border-yellow-500/30">
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-yellow-400">Canjeado por:</span>{' '}
                        {getUserName(foundPrize.redeemedByAdminId)}
                      </p>
                      {foundPrize.redeemedDate && (
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-yellow-400">Fecha de canje:</span>{' '}
                          {new Date(foundPrize.redeemedDate).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded text-sm font-medium flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-green-900/30 text-green-400 border border-green-700'
                    : message.type === 'info'
                    ? 'bg-blue-900/30 text-blue-400 border border-blue-700'
                    : 'bg-red-900/30 text-red-400 border border-red-700'
                }`}
              >
                {message.type === 'success' && <CheckCircleIcon className="h-4 w-4" />}
                {message.text}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleRedeem}
                disabled={!foundPrize || foundPrize.redeemed}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {foundPrize?.redeemed ? 'Premio Ya Canjeado' : 'Confirmar Canje'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPrizeRedemptionModal;
