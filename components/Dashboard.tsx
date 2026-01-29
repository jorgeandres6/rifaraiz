
import React, { useState } from 'react';
import { User, Raffle, Ticket, Commission, UserRole, ExtraPrize, Notification, UserPrize } from '../types';
import AdminPanel from './AdminPanel';
import RaffleCard from './RaffleCard';
import MyTickets from './MyTickets';
import Commissions from './Commissions';
import { TicketIcon, GiftIcon, ShoppingCartIcon, TrophyIcon } from './icons';
import ReferralStats from './ReferralStats';
import LeaderboardsPage from './LeaderboardsPage';
import RouletteModal from './RouletteModal';

interface DashboardProps {
  currentUser: User;
  raffles: Raffle[];
  tickets: Ticket[];
  commissions: Commission[];
  users: User[];
  userPrizes: UserPrize[];
  onPurchaseTicket: (raffleId: string, amount: number, totalCost: number) => void;
  onAddRaffle: (newRaffleData: Omit<Raffle, 'id' | 'soldTickets' | 'currentSales'>) => void;
  onTransferTickets: (ticketIds: string[], recipientEmail: string) => { success: boolean; message?: string };
  onUpdateUser: (updatedUser: User) => void;
  onUpdateRaffle: (updatedRaffle: Raffle) => void;
  raffleForRoulette: Raffle | null;
  onPrizeWon: (prize: ExtraPrize, raffleId: string) => Promise<void>;
  onCloseRoulette: () => void;
  onAddNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  onRedeemPrize?: (prizeId: string, code: string, adminId: string) => boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  raffles,
  tickets,
  commissions,
  users,
  userPrizes,
  onPurchaseTicket,
  onAddRaffle,
  onTransferTickets,
  onUpdateUser,
  onUpdateRaffle,
  raffleForRoulette,
  onPrizeWon,
  onCloseRoulette,
  onAddNotification,
  onRedeemPrize,
}) => {
  // Defensive: wait for currentUser to be set before operating on user-specific data
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState('buy');
  const myTickets = tickets.filter(t => t.userId === currentUser.id);
  const myPrizes = userPrizes.filter(p => p.userId === currentUser.id);

  const getTabClass = (tabName: string) => {
    return `whitespace-nowrap flex items-center shrink-0 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
        activeTab === tabName
            ? 'border-indigo-500 text-indigo-400'
            : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
    }`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'buy':
        return (
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">Rifas Activas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {raffles.map(raffle => {
                  // Standard Card
                  const standardCard = (
                      <RaffleCard 
                          key={raffle.id} 
                          raffle={raffle} 
                          onPurchase={onPurchaseTicket} 
                          hasActiveTickets={myTickets.length > 0}
                          users={users}
                      />
                  );

                  // Derived Fidelity Card
                  // Creates a virtual fidelity raffle if the original raffle has associated businesses
                  const fidelityCard = raffle.associatedBusinesses && raffle.associatedBusinesses.length > 0 ? (
                      <RaffleCard
                          key={`${raffle.id}-fidelity`}
                          raffle={{
                              ...raffle,
                              id: `${raffle.id}_fidelity`,
                              title: `${raffle.title}`,
                              isFidelity: true
                          }}
                          onPurchase={onPurchaseTicket}
                          hasActiveTickets={false} // Fidelity participation logic is different
                          users={users}
                      />
                  ) : null;

                  return (
                      <React.Fragment key={raffle.id}>
                          {standardCard}
                          {fidelityCard}
                      </React.Fragment>
                  );
              })}
            </div>
          </div>
        );
      case 'tickets':
        return (
          <MyTickets 
            tickets={myTickets} 
            raffles={raffles} 
            users={users} 
            onTransferTickets={onTransferTickets} 
          />
        );
      case 'rewards':
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    <Commissions 
                      commissions={commissions} 
                      users={users} 
                      currentUser={currentUser}
                      raffles={raffles}
                      tickets={tickets}
                    />
                </div>
                 <div className="space-y-8">
                    <ReferralStats currentUser={currentUser} users={users} tickets={tickets} raffles={raffles} />
                </div>
            </div>
        );
      case 'leaderboards':
          return (
              <LeaderboardsPage
                  users={users}
                  tickets={tickets}
                  raffles={raffles}
                  currentUser={currentUser}
              />
          );
      case 'prizes':
          return (
              <div>
                  <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">Mis Premios Ganados</h2>
                  {myPrizes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {myPrizes.map(prize => {
                              const raffle = raffles.find(r => r.id === prize.raffleId);
                              const isRedeemed = prize.redeemed || false;
                              
                              return (
                                  <div 
                                      key={prize.id} 
                                      className={`rounded-lg shadow-xl overflow-hidden border ring-1 transition-all ${
                                          isRedeemed 
                                              ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 ring-gray-600/20 opacity-75'
                                              : 'bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border-yellow-500/30 ring-yellow-500/20'
                                      }`}
                                  >
                                      <div className="p-6">
                                          <div className="flex items-start justify-between mb-4">
                                              <div className="flex-grow">
                                                  <h3 className={`text-lg font-bold ${isRedeemed ? 'text-gray-400' : 'text-yellow-400'}`}>
                                                      {prize.prizeName}
                                                  </h3>
                                                  <p className={`text-sm mt-1 ${isRedeemed ? 'text-gray-500' : 'text-gray-400'}`}>
                                                      De: {raffle?.title || 'Rifa desconocida'}
                                                  </p>
                                              </div>
                                              <div className={`rounded-full p-2 flex-shrink-0 ${isRedeemed ? 'bg-gray-600/30' : 'bg-yellow-500/20'}`}>
                                                  <GiftIcon className={`h-6 w-6 ${isRedeemed ? 'text-gray-500' : 'text-yellow-400'}`} />
                                              </div>
                                          </div>
                                          <div className={`border-t pt-4 mt-4 ${isRedeemed ? 'border-gray-600' : 'border-yellow-500/20'}`}>
                                              <p className={`text-xs uppercase tracking-wide mb-1 ${isRedeemed ? 'text-gray-600' : 'text-gray-500'}`}>
                                                  {isRedeemed ? 'Canjeado' : 'Fecha de Premio'}
                                              </p>
                                              <p className={`text-sm font-medium ${isRedeemed ? 'text-gray-400' : 'text-yellow-300'}`}>
                                                  {isRedeemed && prize.redeemedDate
                                                      ? prize.redeemedDate.toLocaleDateString('es-ES', {
                                                          year: 'numeric',
                                                          month: 'long',
                                                          day: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit'
                                                      })
                                                      : prize.dateWon.toLocaleDateString('es-ES', {
                                                          year: 'numeric',
                                                          month: 'long',
                                                          day: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit'
                                                      })
                                                  }
                                              </p>
                                          </div>
                                          <div className={`border-t pt-4 mt-4 ${isRedeemed ? 'border-gray-600' : 'border-yellow-500/20'}`}>
                                              <p className={`text-xs uppercase tracking-wide mb-1 ${isRedeemed ? 'text-gray-600' : 'text-gray-500'}`}>
                                                  Código de Canje
                                              </p>
                                              <p className={`text-lg font-bold font-mono tracking-wider ${isRedeemed ? 'text-gray-400' : 'text-yellow-300'}`}>
                                                  {prize.code}
                                              </p>
                                          </div>
                                          {isRedeemed && (
                                              <div className="w-full mt-4 px-4 py-2 bg-gray-600 text-gray-300 font-medium text-sm rounded-md text-center">
                                                  ✓ Canjeado
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="text-center py-12">
                          <GiftIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400 text-lg">No has ganado premios aún</p>
                          <p className="text-gray-500 text-sm mt-2">¡Compra boletos y gira la ruleta para ganar premios!</p>
                      </div>
                  )}
              </div>
          );
      default:
        return null;
    }
  };


  return (
    <div className="space-y-8">
      {currentUser.role === UserRole.ADMIN && (
        <AdminPanel 
          onAddRaffle={onAddRaffle} 
          raffles={raffles} 
          tickets={tickets} 
          commissions={commissions} 
          users={users}
          userPrizes={userPrizes}
          onUpdateUser={onUpdateUser}
          onUpdateRaffle={onUpdateRaffle}
          currentUser={currentUser}
          onAddNotification={onAddNotification}
          onRedeemPrize={onRedeemPrize || (() => false)}
        />
      )}

      {/* Tab Navigation for all users */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            <button onClick={() => setActiveTab('buy')} className={getTabClass('buy')}>
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Comprar Boletos
            </button>
            <button onClick={() => setActiveTab('tickets')} className={getTabClass('tickets')}>
                <TicketIcon className="h-5 w-5 mr-2" />
                Mis Boletos
            </button>
            <button onClick={() => setActiveTab('prizes')} className={getTabClass('prizes')}>
                <GiftIcon className="h-5 w-5 mr-2" />
                Mis Premios
            </button>
            <button onClick={() => setActiveTab('rewards')} className={getTabClass('rewards')}>
                <GiftIcon className="h-5 w-5 mr-2" />
                Recompensas y Estadísticas
            </button>
            <button onClick={() => setActiveTab('leaderboards')} className={getTabClass('leaderboards')}>
                <TrophyIcon className="h-5 w-5 mr-2" />
                Leaderboards
            </button>
        </nav>
      </div>
      
      <div className="mt-8">
        {renderTabContent()}
      </div>

      {raffleForRoulette && (
        <RouletteModal
            raffle={raffleForRoulette}
            onPrizeWon={onPrizeWon}
            onClose={onCloseRoulette}
        />
      )}
    </div>
  );
};

export default Dashboard;
