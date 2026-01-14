
import React from 'react';
import { User } from '../types';
import { XIcon, UserCircleIcon, MailIcon, PhoneIcon, MapPinIcon, BuildingStoreIcon } from './icons';

interface BusinessInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

const BusinessInfoModal: React.FC<BusinessInfoModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  // Mock phone and city if not present in the base User type, 
  // though in a real scenario these should be in the User interface.
  // We will assume for this display they might exist or show generic placeholders.
  const displayPhone = "+57 300 123 4567"; 
  const displayCity = "Ciudad General";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm relative transform transition-all border border-gray-600 overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 text-center relative">
            <button onClick={onClose} className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors">
                <XIcon className="h-6 w-6" />
            </button>
            <div className="mx-auto bg-white/10 w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md border-2 border-white/20 mb-3 shadow-lg">
                <BuildingStoreIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">{user.name}</h3>
            <span className="text-xs uppercase tracking-widest text-purple-200 font-semibold bg-white/10 px-2 py-1 rounded mt-2 inline-block">
                Comercio Asociado
            </span>
        </div>

        <div className="p-6 space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg border border-gray-700 hover:border-indigo-500/50 transition-colors">
                <div className="bg-gray-700 p-2 rounded-full">
                    <MailIcon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                    <p className="text-xs text-gray-400">Correo Electrónico</p>
                    <p className="text-sm font-medium text-white break-all">{user.email}</p>
                </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg border border-gray-700 hover:border-indigo-500/50 transition-colors">
                <div className="bg-gray-700 p-2 rounded-full">
                    <UserCircleIcon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                    <p className="text-xs text-gray-400">Código de Referido</p>
                    <p className="text-sm font-medium text-white font-mono">{user.referralCode}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                 <div className="flex items-center space-x-2 p-2 bg-gray-700/30 rounded-lg border border-gray-700">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <div>
                         <p className="text-[10px] text-gray-500">Teléfono</p>
                         <p className="text-xs text-gray-300">{displayPhone}</p>
                    </div>
                 </div>
                 <div className="flex items-center space-x-2 p-2 bg-gray-700/30 rounded-lg border border-gray-700">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <div>
                         <p className="text-[10px] text-gray-500">Ubicación</p>
                         <p className="text-xs text-gray-300">{displayCity}</p>
                    </div>
                 </div>
            </div>
        </div>

        <div className="p-4 bg-gray-900/50 border-t border-gray-700 text-center">
            <button 
                onClick={onClose}
                className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoModal;
