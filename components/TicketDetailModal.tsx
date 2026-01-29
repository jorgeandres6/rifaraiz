import React from 'react';
import { Ticket, Raffle, User } from '../types';
import { XIcon, UserCircleIcon, TicketIcon, InformationCircleIcon, CurrencyDollarIcon } from './icons';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  raffle: Raffle;
  users: User[];
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ isOpen, onClose, ticket, raffle, users }) => {
  if (!isOpen) return null;

  const originalOwner = users.find(u => u.id === ticket.originalUserId);
  const publicGoalAmount = raffle.salesGoal && raffle.goalThresholdPercent
    ? raffle.salesGoal * (raffle.goalThresholdPercent / 100)
    : undefined;


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative transform transition-all p-6 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
          <XIcon className="h-6 w-6" />
        </button>
        
        {/* Graphical Ticket */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-2xl p-6 relative overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <TicketIcon className="absolute -top-8 -right-8 h-40 w-40 text-white/10 opacity-50 transform rotate-12" />
            <div className="flex space-x-4 relative z-0">
                {/* Main Ticket Part */}
                <div className="flex-grow">
                    <p className="text-sm font-semibold text-indigo-200 tracking-widest">RIFA OFICIAL</p>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mt-1 leading-tight">{raffle.title}</h2>
                    <div className="mt-4 bg-black/20 backdrop-blur-sm inline-block p-2 rounded-md">
                        <p className="text-xs text-indigo-200">PREMIO:</p>
                        <p className="text-md font-semibold text-white">{raffle.prizeInfo}</p>
                    </div>
                    <div className="mt-5">
                         <p className="text-sm text-indigo-200">NÚMERO DE BOLETO</p>
                         <p className="text-3xl lg:text-4xl font-mono font-bold text-white tracking-wider">{ticket.ticketNumber}</p>
                    </div>
                </div>
                {/* Perforated Line and Stub */}
                <div className="border-l-2 border-dashed border-white/30 pl-4 flex-shrink-0 w-44 flex flex-col justify-between text-right">
                    <div>
                        <h3 className="font-bold text-white text-sm">{raffle.title}</h3>
                        <p className="font-mono text-lg text-white mt-1">{ticket.ticketNumber}</p>
                    </div>
                    <div className="space-y-2 text-xs text-indigo-100">
                        {publicGoalAmount && (
                          <div className="flex items-center justify-end">
                              <span>Meta: ${publicGoalAmount.toLocaleString()}</span>
                              <CurrencyDollarIcon className="h-4 w-4 ml-1.5 text-indigo-200"/>
                          </div>
                        )}
                        <div className="flex items-center justify-end">
                            <span>{originalOwner?.name || 'N/A'}</span>
                            <UserCircleIcon className="h-4 w-4 ml-1.5 text-indigo-200"/>
                        </div>
                         <div className="flex items-center justify-end pt-1">
                            <span>Transf: {ticket.transferCount}/3</span>
                            <InformationCircleIcon className="h-4 w-4 ml-1.5 text-indigo-200"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;