import React, { useMemo, useState } from 'react';
import { Commission, User, CommissionStatus, Raffle, Ticket } from '../types';
import { GiftIcon, TrophyIcon, InformationCircleIcon } from './icons';

interface CommissionsProps {
  commissions: Commission[];
  users: User[];
  currentUser: User;
  raffles: Raffle[];
  tickets: Ticket[];
}

const Commissions: React.FC<CommissionsProps> = ({ commissions, users, currentUser, raffles, tickets }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const myCommissions = commissions.filter(c => c.userId === currentUser.id);

  const totalPending = myCommissions
    .filter(c => c.status === CommissionStatus.PENDING)
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaid = myCommissions
    .filter(c => c.status === CommissionStatus.PAID)
    .reduce((sum, c) => sum + c.amount, 0);

  const packRewards = useMemo(() => {
    const earningsByRaffle: Map<string, { raffleTitle: string; amount: number; details: string[] }> = new Map();

    const myBonusPackTickets = tickets.filter(
        t => t.originalUserId === currentUser.id && t.purchasedPackInfo?.participationBonusPercent
    );

    if (myBonusPackTickets.length === 0) {
        return { total: 0, breakdown: [] };
    }

    const uniqueRaffles = [...new Set(myBonusPackTickets.map(t => t.raffleId))];

    uniqueRaffles.forEach((raffleId: string) => {
        const raffle = raffles.find(r => r.id === raffleId);
        if (!raffle || raffle.currentSales === 0) return; // if no sales, no bonus

        // Corrected calculation to use actual sales revenue
        const totalSales = raffle.currentSales;

        const uniquePacksInRaffle = myBonusPackTickets
            .filter(t => t.raffleId === raffleId)
            .reduce((acc, ticket) => {
                // Use price normalized to 2 decimals for stable keys
                const priceNormalized = Math.round((ticket.purchasedPackInfo!.price) * 100) / 100;
                const key = `${ticket.purchasedPackInfo!.quantity}_${priceNormalized}`;
                if (!acc.has(key)) {
                    acc.set(key, { ...ticket.purchasedPackInfo!, price: priceNormalized });
                }
                return acc;
            }, new Map<string, Exclude<Ticket['purchasedPackInfo'], undefined>>());

        uniquePacksInRaffle.forEach((pack) => {
            if (!pack || !pack.participationBonusPercent) return;
            
            const bonusPool = totalSales * (pack.participationBonusPercent / 100);

            const allPackTickets = tickets.filter(
                t => t.raffleId === raffleId &&
                      t.purchasedPackInfo?.quantity === pack.quantity &&
                      t.purchasedPackInfo?.price !== undefined && Math.abs((t.purchasedPackInfo!.price) - pack.price) < 0.005
            );

            const uniqueBuyers = [...new Set(allPackTickets.map(t => t.originalUserId))];

            if (uniqueBuyers.length > 0 && uniqueBuyers.includes(currentUser.id)) {
                const userShare = bonusPool / uniqueBuyers.length;

                if (!earningsByRaffle.has(raffleId)) {
                      earningsByRaffle.set(raffleId, { raffleTitle: raffle.title, amount: 0, details: [] });
                }
                const entry = earningsByRaffle.get(raffleId)!;
                entry.amount += userShare;
                entry.details.push(`+ $${userShare.toFixed(2)} del pack de ${pack.quantity} boletos (${pack.participationBonusPercent}% bonus)`);
            }
        });
    });

    const breakdown = Array.from(earningsByRaffle.values());
    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

    return { total, breakdown };
  }, [currentUser, tickets, raffles]);


  // Generate a referral deep link to easily share
  const generateReferralLink = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin || 'https://rifaraiz.com';
    return `${base}/?ref=${encodeURIComponent(currentUser.referralCode)}`;
  };

  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const copyReferralLink = async () => {
    const link = generateReferralLink();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const ta = document.createElement('textarea');
        ta.value = link;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setCopyMsg('Enlace copiado al portapapeles');
      setTimeout(() => setCopyMsg(null), 2500);
    } catch (err) {
      setCopyMsg('No se pudo copiar el enlace');
      setTimeout(() => setCopyMsg(null), 2500);
    }
  };

  const shareViaWhatsApp = () => {
    const link = generateReferralLink();
    const msg = `Únete a RifaRaiz con mi código ${currentUser.referralCode}! Regístrate aquí: ${link}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(wa, '_blank');
  };

  const shareViaEmail = () => {
    const link = generateReferralLink();
    const subject = 'Únete a RifaRaiz';
    const body = `Hola! Usa mi código ${currentUser.referralCode} al registrarte en RifaRaiz: ${link}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const tryWebShare = async () => {
    const link = generateReferralLink();
    const shareData: any = {
      title: 'RifaRaiz - Únete',
      text: `Regístrate con mi código ${currentUser.referralCode}`,
      url: link,
    };
    try {
      // @ts-ignore
      if (navigator.share) await navigator.share(shareData);
      else setCopyMsg('Funcionalidad de compartir no disponible');
    } catch (err) {
      setCopyMsg('No se pudo compartir');
      setTimeout(() => setCopyMsg(null), 2500);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-indigo-400 mb-4">Mis Recompensas</h3>
        
        {/* Referral Commissions Section */}
        <div>
          <h4 className="font-semibold text-white mb-2">Comisiones por Referidos</h4>

          {/* Share / referral code area */}
          <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-md mb-4">
            <div>
              <p className="text-sm text-gray-400">Tu código de referido</p>
              <p className="text-lg font-bold text-indigo-400">{currentUser.referralCode}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyReferralLink} className="bg-gray-600 hover:bg-gray-500 p-2 rounded-md text-sm text-white" title="Copiar enlace">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 7a1 1 0 011-1h5a1 1 0 011 1v7a1 1 0 11-2 0V8H9a1 1 0 01-1-1z"/><path d="M3 5a2 2 0 012-2h6a2 2 0 012 2v1a1 1 0 11-2 0V5H5v9h4a1 1 0 110 2H5a2 2 0 01-2-2V5z"/></svg>
              </button>
              <button onClick={shareViaWhatsApp} className="bg-green-600 hover:bg-green-500 p-2 rounded-md text-sm text-white" title="Compartir por WhatsApp">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.86 11.86 0 0012 .75 11.86 11.86 0 003.48 3.48 11.86 11.86 0 00.75 12c0 2.02.53 3.9 1.48 5.6L.24 22.5l4.98-1.3A11.94 11.94 0 0012 23.25c2.02 0 3.9-.53 5.6-1.48A11.86 11.86 0 0023.25 12c0-3.17-1.22-6.14-2.73-8.52z"/><path d="M17.1 14.28c-.29-.14-1.72-.85-1.99-.95-.27-.1-.47-.14-.67.14-.2.29-.77.95-.94 1.15-.17.2-.33.22-.62.08-1.69-.83-2.8-1.49-3.93-3.36-.29-.5.29-.46.84-1.53.1-.22.05-.39-.03-.54-.09-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.19 0-.5.07-.76.36s-1 1-1 2.45c0 1.44 1.03 2.83 1.17 3.03.14.2 2.03 3.17 4.92 4.32 2.13.94 2.78.98 3.74.82.6-.09 1.72-.7 1.96-1.37.24-.67.24-1.25.17-1.37-.07-.12-.27-.2-.57-.34z"/></svg>
              </button>
              <button onClick={shareViaEmail} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-md text-sm text-white" title="Compartir por correo">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.94 6.94A2 2 0 014 6h12a2 2 0 011.06.94L10 11 2.94 6.94z"/><path d="M18 8.64v5.86A2 2 0 0116 17H4a2 2 0 01-2-2V8.64l8 4 8-4z"/></svg>
              </button>
              <button onClick={tryWebShare} className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-md text-sm text-white" title="Más opciones">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 11-2.995-3A3 3 0 0115 8zM7 12a3 3 0 11-2.995-3A3 3 0 017 12zM15 16a3 3 0 11-2.995-3A3 3 0 0115 16z"/></svg>
              </button>
            </div>
          </div>

          {copyMsg && <p className="text-sm text-green-400 mb-3">{copyMsg}</p>}

          <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Pendiente</p>
                  <p className="text-2xl font-bold text-yellow-400">${totalPending.toFixed(2)}</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Pagado</p>
                  <p className="text-2xl font-bold text-green-400">${totalPaid.toFixed(2)}</p>
              </div>
          </div>
          {myCommissions.length > 0 && (
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2 mt-4">
              {myCommissions.map(commission => {
                  const sourceUser = users.find(u => u.id === commission.sourceUserId);
                  return (
                      <li key={commission.id} className="bg-gray-700/50 p-3 rounded-md flex items-center justify-between text-sm">
                          <div className="flex items-center">
                              <GiftIcon className="h-5 w-5 mr-3 text-indigo-400"/>
                              <div>
                                  <p className="font-semibold text-white">${commission.amount.toFixed(2)}</p>
                                  <p className="text-xs text-gray-400">
                                      Nivel {commission.level} - de {sourceUser ? `${sourceUser.name} (${sourceUser.referralCode})` : 'Usuario desconocido'}
                                  </p>
                              </div>
                          </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                          commission.status === CommissionStatus.PENDING ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                          {commission.status}
                      </span>
                      </li>
                  );
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-gray-700 pt-6">
          <div className="flex items-center mb-2 gap-2">
            <h4 className="font-semibold text-white">Recompensas por Packs de Boletos</h4>
            <div 
                className="relative flex items-center"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
            >
                 <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-pointer hover:text-indigo-400 transition-colors" />
                 {showTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded py-2 px-3 z-10 border border-gray-600 shadow-lg text-center">
                        Este bono se activa al concluir la dinámica de la rifa
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-600"></div>
                    </div>
                 )}
            </div>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400">Ganancias Totales por Participación</p>
            <p className="text-2xl font-bold text-green-400">${packRewards.total.toFixed(2)}</p>
          </div>
          {packRewards.breakdown.length === 0 ? (
            <p className="text-gray-400 text-center py-4 mt-4 bg-gray-900/50 rounded-md">No has ganado recompensas por packs aún.</p>
          ) : (
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2 mt-4">
              {packRewards.breakdown.map((reward, index) => (
                <li key={index} className="bg-gray-700/50 p-3 rounded-md text-sm space-y-2">
                  {/* Raffle Total */}
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center">
                      <TrophyIcon className="h-5 w-5 mr-3 text-yellow-400 flex-shrink-0" />
                      <p className="text-white">
                        Ganancia en "{reward.raffleTitle}"
                      </p>
                    </div>
                    <p className="text-lg text-green-400">${reward.amount.toFixed(2)}</p>
                  </div>

                  {/* Breakdown per pack */}
                  {reward.details.length > 0 && (
                    <div className="pl-8 space-y-1 border-l-2 border-gray-600 ml-2.5 pt-1">
                      {reward.details.map((detail, detailIndex) => (
                        <p key={detailIndex} className="text-xs text-gray-300">
                          {detail}
                        </p>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <p className="text-center text-sm text-gray-300 border-t border-gray-700 pt-6">
          Tu código de referido: <strong className="text-indigo-400 bg-gray-700 px-2 py-1 rounded">{currentUser.referralCode}</strong>
      </p>

    </div>
  );
};

export default Commissions;