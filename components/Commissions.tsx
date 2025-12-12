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
                const key = `${ticket.purchasedPackInfo!.quantity}_${ticket.purchasedPackInfo!.price}`;
                if (!acc.has(key)) {
                    acc.set(key, ticket.purchasedPackInfo!);
                }
                return acc;
            }, new Map<string, Exclude<Ticket['purchasedPackInfo'], undefined>>());

        uniquePacksInRaffle.forEach((pack) => {
            if (!pack || !pack.participationBonusPercent) return;
            
            const bonusPool = totalSales * (pack.participationBonusPercent / 100);

            const allPackTickets = tickets.filter(
                t => t.raffleId === raffleId &&
                      t.purchasedPackInfo?.quantity === pack.quantity &&
                      t.purchasedPackInfo?.price === pack.price
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


  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-indigo-400 mb-4">Mis Recompensas</h3>
        
        {/* Referral Commissions Section */}
        <div>
          <h4 className="font-semibold text-white mb-2">Comisiones por Referidos</h4>
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

        {/* Pack Rewards Section */}
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