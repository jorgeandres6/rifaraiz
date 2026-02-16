
import React, { useState } from 'react';
import iconoRR from '../src/img/iconoRR.png';
import { User } from '../types';
import { UserCircleIcon, ChevronDownIcon, BellIcon, Cog6ToothIcon, ShareIcon } from './icons';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  switchUser: (userId: string) => void;
  onLogout: () => void;
  onOpenNotifications: () => void;
  hasUnreadNotifications: boolean;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, allUsers, switchUser, onLogout, onOpenNotifications, hasUnreadNotifications, onOpenSettings }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyReferral = async () => {
    try {
      const code = currentUser?.referralCode || '';
      const url = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback: create a temporary input to copy
      try {
        const code = currentUser?.referralCode || '';
        const url = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
        const tmp = document.createElement('input');
        tmp.value = url;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 text-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <img src={iconoRR} alt="RifaRaiz Logo" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-4">
             {/* Referral code + copy button */}
             {currentUser?.referralCode && (
               <button onClick={handleCopyReferral} title="Copiar enlace de referido" className="flex items-center gap-2 rounded-md bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 transition">
                 <ShareIcon className="h-4 w-4" />
                 <span className="font-mono hidden sm:inline">{currentUser.referralCode}</span>
                 <span className="sm:hidden text-xs">Ref</span>
                 {copied && <span className="ml-2 text-xs text-green-400">¡Copiado!</span>}
               </button>
             )}

             {/* Notification Button */}
             <button 
                onClick={onOpenNotifications}
                className="relative rounded-full bg-gray-800 p-2 text-gray-400 hover:text-white hover:bg-gray-700 transition focus:outline-none"
             >
                <BellIcon className="h-6 w-6" />
                {hasUnreadNotifications && (
                    <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-gray-800" />
                )}
             </button>

             {/* User Profile Dropdown */}
             <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 rounded-full bg-gray-800 p-2 text-white hover:bg-gray-700 transition"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  <span className="hidden sm:inline">{currentUser.name}</span>
                  <ChevronDownIcon className={`h-5 w-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                       <button
                          onClick={() => {
                              onOpenSettings();
                              setDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                        >
                          <Cog6ToothIcon className="h-4 w-4 mr-2" />
                          Configuración
                        </button>
                       <button
                          onClick={onLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
                        >
                          Cerrar Sesión
                        </button>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
