
import React, { useState } from 'react';
import { User, Raffle, Ticket, Commission, UserRole, ExtraPrize, Notification } from '../types';
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
  onPurchaseTicket: (raffleId: string, amount: number, totalCost: number) => void;
  onAddRaffle: (newRaffleData: Omit<Raffle, 'id' | 'soldTickets' | 'currentSales'>) => void;
  onTransferTickets: (ticketIds: string[], recipientEmail: string) => { success: boolean; message?: string };
  onUpdateUser: (updatedUser: User) => void;
  onUpdateRaffle: (updatedRaffle: Raffle) => void;
  raffleForRoulette: Raffle | null;
  onPrizeWon: (prize: ExtraPrize, raffleId: string) => void;
  onCloseRoulette: () => void;
  onAddNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  raffles,
  tickets,
  commissions,
  users,
  onPurchaseTicket,
  onAddRaffle,
  onTransferTickets,
  onUpdateUser,
  onUpdateRaffle,
  raffleForRoulette,
  onPrizeWon,
  onCloseRoulette,
  onAddNotification,
}) => {
  // Defensive: wait for currentUser to be set before operating on user-specific data
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState('buy');
  const myTickets = tickets.filter(t => t.userId === currentUser.id);

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
          onUpdateUser={onUpdateUser}
          onUpdateRaffle={onUpdateRaffle}
          currentUser={currentUser}
          onAddNotification={onAddNotification}
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
