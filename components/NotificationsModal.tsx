import React, { useState } from 'react';
import { XIcon, BellIcon } from './icons';
import { Notification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, notifications, onMarkAsRead }) => {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Increased z-index from 40 to 60 to appear above sticky header (z-50) */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm relative transform transition-all animate-fade-in border border-gray-700" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center">
                  <BellIcon className="h-5 w-5 text-indigo-400 mr-2" />
                  <h3 className="font-bold text-white">Notificaciones</h3>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <XIcon className="h-5 w-5" />
              </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                  <ul className="divide-y divide-gray-700">
                      {notifications.sort((a,b) => b.date.getTime() - a.date.getTime()).map(notif => (
                          <li 
                              key={notif.id} 
                              onClick={() => {
                                  setSelectedNotification(notif);
                                  onMarkAsRead(notif.id);
                              }}
                              className={`p-4 hover:bg-gray-700/50 transition-colors cursor-pointer ${!notif.read ? 'bg-gray-700/20' : ''}`}
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <div className="flex items-center gap-2">
                                    {!notif.read && (
                                        <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="No leído"></span>
                                    )}
                                    <h4 className={`text-sm font-semibold ${!notif.read ? 'text-white' : 'text-gray-300'}`}>{notif.title}</h4>
                                  </div>
                                  <span className="text-xs text-gray-500">{formatDate(notif.date)}</span>
                              </div>
                              <p className="text-sm text-gray-400 line-clamp-2">{notif.message}</p>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <div className="p-8 text-center text-gray-500">
                      No tienes notificaciones nuevas.
                  </div>
              )}
          </div>
          <div className="p-3 border-t border-gray-700 text-center">
              <button onClick={onClose} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                  Cerrar
              </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Notificación */}
      {selectedNotification && (
        // Increased z-index to 70 to appear above the list modal
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4" onClick={() => setSelectedNotification(null)}>
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md relative transform transition-all p-6 border border-gray-600 animate-fade-in" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center">
                        <div className="p-2 bg-indigo-500/20 rounded-full mr-3">
                            <BellIcon className="h-6 w-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">{selectedNotification.title}</h3>
                    </div>
                    <button onClick={() => setSelectedNotification(null)} className="text-gray-400 hover:text-white transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="mb-6 bg-gray-900/50 p-4 rounded-md border border-gray-700">
                    <p className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap">
                        {selectedNotification.message}
                    </p>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 italic">Recibido: {formatDate(selectedNotification.date)}</span>
                    <button 
                        onClick={() => setSelectedNotification(null)}
                        className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default NotificationsModal;