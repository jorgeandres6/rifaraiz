import React, { useState } from 'react';
import { UserPrize, User } from '../types';
import { XIcon, CheckCircleIcon } from './icons';

interface AdminPrizeRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPrizes: UserPrize[];
  users?: User[];
  onRedeemPrize: (prizeId: string, code: string) => boolean;
}

const AdminPrizeRedemptionModal: React.FC<AdminPrizeRedemptionModalProps> = ({
  isOpen,
  onClose,
  userPrizes,
  users = [],
  onRedeemPrize,
}) => {
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const unredeemed = userPrizes.filter(p => !p.redeemed);
  const selectedPrize = userPrizes.find(p => p.id === selectedPrizeId);
  
  // Function to get username from users array
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || `Usuario ${userId.slice(0, 6)}`;
  };

  const handleRedeem = () => {
    if (!selectedPrizeId || !code) {
      setMessage({ text: 'Por favor selecciona un premio e ingresa el código', type: 'error' });
      return;
    }

    const success = onRedeemPrize(selectedPrizeId, code);
    if (success) {
      setMessage({ text: 'Premio canjeado exitosamente', type: 'success' });
      setCode('');
      setSelectedPrizeId('');
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } else {
      setMessage({ text: 'Error al canjear el premio. Verifica el código', type: 'error' });
    }
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
            {/* Prize Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selecciona el premio
              </label>
              <select
                value={selectedPrizeId}
                onChange={(e) => {
                  setSelectedPrizeId(e.target.value);
                  setCode('');
                  setMessage(null);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Selecciona un premio --</option>
                {unredeemed.map((prize) => (
                  <option key={prize.id} value={prize.id}>
                    {prize.prizeName} - {getUserName(prize.userId)}
                  </option>
                ))}
              </select>
            </div>

            {/* Prize Details */}
            {selectedPrize && (
              <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <p className="text-sm text-gray-400">
                  <span className="font-medium text-gray-300">Premio:</span> {selectedPrize.prizeName}
                </p>
                <p className="text-sm text-gray-400">
                  <span className="font-medium text-gray-300">Usuario:</span> {getUserName(selectedPrize.userId)}
                </p>
                <p className="text-sm text-gray-400">
                  <span className="font-medium text-gray-300">Ganado:</span>{' '}
                  {new Date(selectedPrize.dateWon).toLocaleDateString('es-MX')}
                </p>
              </div>
            )}

            {/* Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código de canje
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123XY"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded text-sm font-medium flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-green-900/30 text-green-400 border border-green-700'
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
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Canjear
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
