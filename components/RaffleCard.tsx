
import React, { useState } from 'react';
import { Raffle, User } from '../types';
import { CurrencyDollarIcon, TicketIcon, GiftIcon, LockClosedIcon, CheckCircleIcon, BuildingStoreIcon } from './icons';
import BusinessInfoModal from './BusinessInfoModal';

interface RaffleCardProps {
  raffle: Raffle;
  onPurchase: (raffleId: string, amount: number, totalCost: number) => void;
  hasActiveTickets?: boolean;
  users?: User[]; // Added users to lookup business details
}

const RaffleCard: React.FC<RaffleCardProps> = ({ raffle, onPurchase, hasActiveTickets, users }) => {
  const [selectedPurchase, setSelectedPurchase] = useState<string>(`1_${raffle.ticketPrice}`);
  const [selectedBusinessUser, setSelectedBusinessUser] = useState<User | null>(null);

  const handlePurchase = () => {
    const [quantity, price] = selectedPurchase.split('_').map(Number);
    if (quantity > 0) {
      onPurchase(raffle.id, quantity, price);
    }
  };

  const handleBusinessClick = (businessName: string) => {
    if (!users) return;
    const user = users.find(u => u.name === businessName);
    if (user) {
        setSelectedBusinessUser(user);
    }
  };

  const publicGoalAmount = raffle.salesGoal && raffle.goalThresholdPercent 
    ? raffle.salesGoal * (raffle.goalThresholdPercent / 100)
    : undefined;
  const actualSalesAmount = raffle.currentSales;

  // The raffle is considered ready when actual sales reach the public goal amount.
  const isGoalReached = publicGoalAmount && actualSalesAmount >= publicGoalAmount;

  // Per user request, the displayed current sales are a proportion of the actual sales.
  const displayedCurrentSales = publicGoalAmount && raffle.goalThresholdPercent
    ? actualSalesAmount * (raffle.goalThresholdPercent / 100)
    : undefined;
  
  // To keep the displayed text and progress bar visually consistent, the percentage
  // is calculated as the ratio of actual sales to the total sales goal.
  const progressPercent = raffle.salesGoal && raffle.salesGoal > 0 
    ? Math.min((actualSalesAmount / raffle.salesGoal) * 100, 100)
    : undefined;

  // Special rendering for Fidelity Raffle
  if (raffle.isFidelity) {
      return (
        <>
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col border border-purple-500/50 ring-1 ring-purple-500/30">
            <div className="p-6 flex-grow relative">
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center shadow-lg">
                    <BuildingStoreIcon className="h-3 w-3 mr-1" />
                    Rifa Fidelity
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{raffle.title}</h3>
                <span className="text-xs uppercase tracking-widest text-purple-300 font-semibold mb-2 block">Edición Especial</span>
                <p className="mt-2 text-sm text-gray-300 h-16">{raffle.description}</p>
                
                <div className="mt-4 bg-purple-500/20 rounded-lg p-3 border border-purple-500/30">
                     <p className="text-sm font-semibold text-purple-200 mb-1">Premio Exclusivo:</p>
                     <p className="text-lg font-bold text-white">{raffle.prizeInfo}</p>
                </div>

                <div className="mt-6">
                     <p className="text-xs text-purple-300 font-bold uppercase mb-2">Disponible únicamente en:</p>
                     <div className="bg-gray-900/40 rounded-md p-3 max-h-32 overflow-y-auto custom-scrollbar">
                        <ul className="space-y-2">
                            {raffle.associatedBusinesses?.map((business, index) => (
                                <li 
                                    key={index} 
                                    onClick={() => handleBusinessClick(business)}
                                    className="flex items-center text-sm text-gray-200 cursor-pointer hover:bg-white/10 p-1.5 rounded transition-colors group"
                                >
                                    <BuildingStoreIcon className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0 group-hover:text-purple-300" />
                                    <span className="group-hover:text-white border-b border-transparent group-hover:border-white/50">{business}</span>
                                </li>
                            ))}
                        </ul>
                     </div>
                </div>
            </div>
             <div className="p-4 bg-gray-900/60 mt-auto text-center border-t border-purple-800/50">
                <span className="text-xs text-gray-400 flex items-center justify-center">
                    <LockClosedIcon className="h-3 w-3 mr-1" />
                    Selecciona un comercio para ver detalles
                </span>
             </div>
        </div>
        {selectedBusinessUser && (
            <BusinessInfoModal 
                isOpen={!!selectedBusinessUser} 
                onClose={() => setSelectedBusinessUser(null)} 
                user={selectedBusinessUser}
            />
        )}
        </>
      );
  }

  // Special rendering for Monthly Raffle
  if (raffle.isMonthly) {
      return (
        <div className="bg-gradient-to-br from-yellow-900/40 to-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col border border-yellow-500/30 ring-1 ring-yellow-500/20">
            <div className="p-6 flex-grow relative">
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Rifa Mensual
                </div>
                <h3 className="text-xl font-bold text-yellow-400">{raffle.title}</h3>
                <p className="mt-2 text-sm text-gray-300 h-16">{raffle.description}</p>
                
                <div className="mt-4 bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                     <p className="text-sm font-semibold text-yellow-200 mb-1">Premio:</p>
                     <p className="text-lg font-bold text-white">{raffle.prizeInfo}</p>
                </div>

                <div className="mt-6 flex flex-col items-center justify-center space-y-3">
                    {hasActiveTickets ? (
                        <div className="flex flex-col items-center text-center animate-fade-in">
                            <CheckCircleIcon className="h-12 w-12 text-green-400 mb-2" />
                            <p className="text-green-400 font-bold text-lg">¡Estás Participando!</p>
                            <p className="text-xs text-gray-400 max-w-xs mt-1">
                                Tienes boletos activos que te otorgan acceso automático a este sorteo.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center">
                            <LockClosedIcon className="h-12 w-12 text-gray-500 mb-2" />
                            <p className="text-gray-400 font-bold">Acceso Bloqueado</p>
                             <p className="text-xs text-gray-500 max-w-xs mt-1">
                                Compra boletos de cualquier otra rifa activa para desbloquear tu participación automática.
                            </p>
                        </div>
                    )}
                </div>
            </div>
             <div className="p-4 bg-gray-900/50 mt-auto text-center border-t border-gray-700">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Sorteo exclusivo para clientes</span>
             </div>
        </div>
      );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-bold text-indigo-400">{raffle.title}</h3>
        <p className="mt-2 text-sm text-gray-400 h-16">{raffle.description}</p>
        
        <div className="mt-4 space-y-3 text-sm">
           <div className="flex items-center text-gray-300">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-indigo-400" />
            <span>Precio: ${raffle.ticketPrice.toFixed(2)} / boleto</span>
          </div>
          {publicGoalAmount !== undefined && displayedCurrentSales !== undefined && progressPercent !== undefined && (
            <div>
              <div className="flex justify-between mb-1 text-gray-300 font-medium">
                  <span>Meta para la rifa</span>
                  <span>${displayedCurrentSales.toLocaleString()} / ${publicGoalAmount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                      className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}>
                  </div>
              </div>
              {isGoalReached && (
                   <p className="text-center text-xs mt-2 font-semibold text-green-400">¡Meta alcanzada! El sorteo se realizará pronto.</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 bg-gray-800/50 mt-auto">
        <div className="space-y-3">
          {raffle.extraPrizes && raffle.extraPrizes.length > 0 && (
              <div className="flex items-center justify-center text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-md">
                  <GiftIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span>¡Gira la ruleta de premios con tu compra!</span>
              </div>
          )}
          <select
            value={selectedPurchase}
            onChange={(e) => setSelectedPurchase(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-indigo-500 focus:border-indigo-500"
            aria-label="Seleccionar cantidad de boletos"
          >
            <option value={`1_${raffle.ticketPrice}`}>
              1 Boleto por ${raffle.ticketPrice}
            </option>
            {raffle.ticketPacks?.map((pack, index) => {
              const savings = Math.round(((raffle.ticketPrice * pack.quantity) - pack.price) * 100) / 100;
              const bonusText = pack.participationBonusPercent && pack.participationBonusPercent > 0
                ? ` (+${pack.participationBonusPercent}% Participación Global)`
                : '';
              const fidelityText = pack.isFidelityPack ? ' - 🎟️ + Acceso Fidelity' : '';
              return (
                <option key={index} value={`${pack.quantity}_${pack.price}`}>
                  {pack.quantity} Boletos por ${pack.price.toFixed(2)} {savings > 0 ? `(Ahorra $${savings.toFixed(2)})` : ''}{bonusText}{fidelityText}
                </option>
              );
            })}
          </select>
          
          <button
            onClick={handlePurchase}
            className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300"
          >
              <TicketIcon className="h-5 w-5 mr-2"/>
              Comprar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaffleCard;
