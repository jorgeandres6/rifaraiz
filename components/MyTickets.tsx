import React, { useState, useMemo } from 'react';
import { Ticket, Raffle, User, PurchaseOrder, RouletteChance } from '../types';
import TransferModal from './TransferModal';
import TicketDetailModal from './TicketDetailModal';
import UserPurchaseOrders from './UserPurchaseOrders';

interface MyTicketsProps {
  tickets: Ticket[];
  raffles: Raffle[];
  users: User[];
  purchaseOrders?: PurchaseOrder[];
  rouletteChances: RouletteChance[];
  userId: string;
  onTransferTickets: (ticketIds: string[], recipientEmail: string) => Promise<{ success: boolean; message?: string }>;
  onPlayRoulette?: (raffleId: string) => void;
}

type DisplayItem = {
    id: string;
    type: 'pack' | 'single';
    label: string;
    numberRange: string | null;
    tickets: Ticket[];
}

const MyTickets: React.FC<MyTicketsProps> = ({ tickets, raffles, users, onTransferTickets, purchaseOrders = [], rouletteChances, userId, onPlayRoulette }) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'orders' | 'roulette'>('tickets');
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const ticketsByRaffle = useMemo(() => {
    const groupedByRaffle = tickets.reduce((acc, ticket) => {
        const raffle = raffles.find(r => r.id === ticket.raffleId);
        if (raffle) {
            if (!acc[raffle.id]) {
                acc[raffle.id] = { raffle, tickets: [] };
            }
            acc[raffle.id].tickets.push(ticket);
        }
        return acc;
    }, {} as Record<string, { raffle: Raffle; tickets: Ticket[] }>);

    return Object.values(groupedByRaffle).map(({ raffle, tickets: raffleTickets }) => {
        const purchases = new Map<number, Ticket[]>();
        raffleTickets.forEach(ticket => {
            // Ensure purchaseDate is a Date (some tickets may come with string/null values from different sources)
            const pd = ticket.purchaseDate instanceof Date ? ticket.purchaseDate : new Date(ticket.purchaseDate || 0);
            const key = pd.getTime();
            if (!purchases.has(key)) {
                purchases.set(key, []);
            }
            purchases.get(key)!.push(ticket);
        });

        // FIX: Explicitly type the return of the flatMap callback to `DisplayItem[]`.
        // This helps TypeScript correctly infer the type of the flattened array when the callback
        // has conditional branches that return arrays of different (but compatible) subtypes.
        const displayItems: DisplayItem[] = Array.from(purchases.values()).flatMap((purchaseGroup): DisplayItem[] => {
            if (purchaseGroup.length === 0) return [];

            const isPack = purchaseGroup[0].purchasedPackInfo;

            if (isPack && purchaseGroup.length > 1) {
                const sortedTickets = [...purchaseGroup].sort((a, b) =>
                    a.ticketNumber.localeCompare(b.ticketNumber, undefined, { numeric: true })
                );
                const firstTicket = sortedTickets[0];
                const lastTicket = sortedTickets[sortedTickets.length - 1];
                const packInfo = firstTicket.purchasedPackInfo;

                return [{
                    id: `pack-${firstTicket.id}`,
                    type: 'pack',
                    label: `Pack de ${packInfo?.quantity} Boletos`,
                    numberRange: `(${firstTicket.ticketNumber} - ${lastTicket.ticketNumber})`,
                    tickets: sortedTickets
                }];
            } else {
                return purchaseGroup.map(ticket => ({
                    id: ticket.id,
                    type: 'single',
                    label: `#${ticket.ticketNumber}`,
                    numberRange: null,
                    tickets: [ticket]
                }));
            }
        });

        return { raffle, displayItems, allTicketsForRaffle: raffleTickets };
    });
}, [tickets, raffles]);


  const openTransferModal = (raffle: Raffle) => {
    setSelectedRaffle(raffle);
    setTransferModalOpen(true);
  };
  
  const openDetailModal = (ticket: Ticket) => {
    setSelectedRaffle(raffles.find(r => r.id === ticket.raffleId) || null);
    setSelectedTicket(ticket);
    setDetailModalOpen(true);
  };


  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 py-3 px-4 font-semibold text-center border-b-2 transition ${
            activeTab === 'tickets'
              ? 'border-indigo-400 text-indigo-700'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Mis Boletos ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 px-4 font-semibold text-center border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-indigo-400 text-indigo-700'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Órdenes de Compra ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('roulette')}
          className={`flex-1 py-3 px-4 font-semibold text-center border-b-2 transition ${
            activeTab === 'roulette'
              ? 'border-indigo-400 text-indigo-700'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Oportunidades 🎰
        </button>
      </div>

      {activeTab === 'tickets' ? (
        <>
          <h3 className="text-xl font-semibold text-indigo-700 mb-4">Mis Boletos</h3>
          {ticketsByRaffle.length === 0 ? (
            <p className="text-gray-600 text-center py-4">Aún no has comprado ningún boleto.</p>
          ) : (
            <div className="space-y-6">
              {ticketsByRaffle.map(({ raffle, displayItems, allTicketsForRaffle }) => (
                <div key={raffle.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-900">{raffle.title}</h4>
                    <button
                      onClick={() => openTransferModal(raffle)}
                      className="bg-indigo-600 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-indigo-700"
                    >
                      Transferir
                    </button>
                  </div>
                  <div className="space-y-2">
                    {displayItems.map(item => {
                      if (item.type === 'pack') {
                        return (
                          <div key={item.id} className="bg-white flex justify-between items-center p-2 rounded-md border border-gray-200">
                            <span className="font-semibold text-sm text-indigo-700">{item.label}</span>
                            <span className="font-mono text-xs text-gray-600">{item.numberRange}</span>
                          </div>
                        );
                      } else { // type === 'single'
                        const ticket = item.tickets[0];
                        return (
                          <button
                            key={item.id}
                            onClick={() => openDetailModal(ticket)}
                            className="bg-white text-left w-full p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-mono text-sm text-indigo-700">{item.label}</span>
                          </button>
                        );
                      }
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : activeTab === 'orders' ? (
        <UserPurchaseOrders
          purchaseOrders={purchaseOrders}
          raffles={raffles}
          userId={userId}
        />
      ) : (
        <>
          <h3 className="text-xl font-semibold text-indigo-400 mb-4">Oportunidades de Ruleta 🎰</h3>
          {rouletteChances.filter(rc => rc.userId === userId && rc.chances > 0).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No tienes oportunidades disponibles.</p>
              <p className="text-gray-500 text-sm">Compra boletos y espera a que tu orden sea verificada para acumular oportunidades.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rouletteChances
                .filter(rc => rc.userId === userId && rc.chances > 0)
                .map(rc => {
                  const raffle = raffles.find(r => r.id === rc.raffleId);
                  if (!raffle) return null;
                  return (
                    <div key={rc.id} className="bg-gray-700/50 p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-white">{raffle.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">
                            Tienes <span className="text-indigo-400 font-bold">{rc.chances}</span> {rc.chances === 1 ? 'oportunidad' : 'oportunidades'} disponibles
                          </p>
                        </div>
                        <button
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-md font-bold hover:from-purple-700 hover:to-pink-700 transition"
                          onClick={() => onPlayRoulette && onPlayRoulette(raffle.id)}
                        >
                          Jugar 🎰
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
      {isTransferModalOpen && selectedRaffle && (
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          raffleTitle={selectedRaffle.title}
          tickets={ticketsByRaffle.find(r => r.raffle.id === selectedRaffle.id)?.allTicketsForRaffle || []}
          onTransfer={onTransferTickets}
        />
      )}
      {isDetailModalOpen && selectedTicket && selectedRaffle && (
        <TicketDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          ticket={selectedTicket}
          raffle={selectedRaffle}
          users={users}
        />
      )}
    </div>
  );
};

export default MyTickets;