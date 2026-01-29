import React, { useState } from 'react';
import { Ticket } from '../types';
import { XIcon, PaperAirplaneIcon, MailIcon } from './icons';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffleTitle: string;
  tickets: Ticket[];
  onTransfer: (ticketIds: string[], recipientEmail: string) => Promise<{ success: boolean; message?: string }>;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, raffleTitle, tickets, onTransfer }) => {
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ count: number; email: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTicketIds(prev =>
      prev.includes(ticketId) ? prev.filter(id => id !== ticketId) : [...prev, ticketId]
    );
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (selectedTicketIds.length === 0) {
      setError('Debes seleccionar al menos un boleto para transferir.');
      return;
    }
    if (!recipientEmail) {
      setError('Debes ingresar el correo electrónico del destinatario.');
      return;
    }

    setLoading(true);
    try {
      const result = await onTransfer(selectedTicketIds, recipientEmail);
      if (result.success) {
        setSuccessData({ count: selectedTicketIds.length, email: recipientEmail });
        setSelectedTicketIds([]);
      } else {
        setError(result.message || 'Ocurrió un error desconocido durante la transferencia.');
      }
    } catch (err) {
      setError('Error al realizar la transferencia. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
      setSuccessData(null);
      setRecipientEmail('');
      onClose();
  };

  if (successData) {
      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center animate-fade-in border border-gray-700 transform transition-all scale-100">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">¡Transferencia Exitosa!</h3>
                <p className="text-gray-300 mb-6 text-sm">
                    Has transferido <strong className="text-white">{successData.count}</strong> {successData.count === 1 ? 'boleto' : 'boletos'} correctamente al usuario:
                    <br />
                    <span className="block mt-2 text-indigo-400 font-medium bg-gray-900/50 py-2 px-3 rounded break-all border border-gray-700">
                        {successData.email}
                    </span>
                </p>
                <button 
                    onClick={handleCloseSuccess}
                    className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-indigo-700 transition-colors shadow-lg"
                >
                    Aceptar
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative transform transition-all max-h-[90vh] flex flex-col overflow-hidden">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
          <XIcon className="h-6 w-6" />
        </button>
        <div className="p-6 overflow-y-auto flex-1">
          <h2 className="text-2xl font-bold text-indigo-400">Transferir Boletos</h2>
          <p className="text-gray-400 mt-1">Para la rifa: <span className="font-semibold">{raffleTitle}</span></p>

          <form onSubmit={handleTransfer} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">1. Selecciona los boletos a transferir</label>
              <div className="max-h-48 overflow-y-auto bg-gray-900/50 p-3 rounded-md border border-gray-700 space-y-2">
                {tickets.map(ticket => {
                  const isTransferable = ticket.transferCount < 3;
                  return (
                    <label
                      key={ticket.id}
                      className={`flex items-center p-2 rounded-md transition-colors ${
                        isTransferable ? 'cursor-pointer hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'
                      } ${selectedTicketIds.includes(ticket.id) ? 'bg-indigo-600/50' : 'bg-gray-700/50'}`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isTransferable}
                        checked={selectedTicketIds.includes(ticket.id)}
                        onChange={() => handleTicketSelect(ticket.id)}
                        className="h-4 w-4 rounded bg-gray-800 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-3 font-mono text-white">Boleto #{ticket.ticketNumber}</span>
                      <span className="ml-auto text-xs text-gray-400">
                        Usos: {ticket.transferCount}/3
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-300">2. Correo del Destinatario</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MailIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="recipientEmail"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  className="block w-full bg-gray-900 border border-gray-600 rounded-md p-3 pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="destinatario@email.com"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400 text-center pt-2">{error}</p>}

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center ${loading ? 'bg-indigo-500 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                {loading ? 'Transfiriendo...' : 'Confirmar Transferencia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;