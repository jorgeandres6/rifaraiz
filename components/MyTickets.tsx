import React, { useState, useMemo } from 'react';
import { Ticket, Raffle, User, PurchaseOrder } from '../types';
import TransferModal from './TransferModal';
import TicketDetailModal from './TicketDetailModal';
import UserPurchaseOrders from './UserPurchaseOrders';

interface MyTicketsProps {
  tickets: Ticket[];
  raffles: Raffle[];
  users: User[];
  purchaseOrders?: PurchaseOrder[];
  userId: string;
  onTransferTickets: (ticketIds: string[], recipientEmail: string) => Promise<{ success: boolean; message?: string }>;
}

type DisplayItem = {
    id: string;
    type: 'pack' | 'single';
    label: string;
    numberRange: string | null;
    tickets: Ticket[];
}

const MyTickets: React.FC<MyTicketsProps> = ({ tickets, raffles, users, onTransferTickets, purchaseOrders = [], userId }) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'orders'>('tickets');
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
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 py-3 px-4 font-semibold text-center border-b-2 transition ${
            activeTab === 'tickets'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          Mis Boletos ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 px-4 font-semibold text-center border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          Órdenes de Compra ({purchaseOrders.length})
        </button>
      </div>

      {activeTab === 'tickets' ? (
        <>
          <h3 className="text-xl font-semibold text-indigo-400 mb-4">Mis Boletos</h3>
          {ticketsByRaffle.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Aún no has comprado ningún boleto.</p>
          ) : (
            <div className="space-y-6">
              {ticketsByRaffle.map(({ raffle, displayItems, allTicketsForRaffle }) => (
                <div key={raffle.id} className="bg-gray-700/50 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-white">{raffle.title}</h4>
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
                          <div key={item.id} className="bg-gray-800 flex justify-between items-center p-2 rounded-md">
                            <span className="font-semibold text-sm text-indigo-300">{item.label}</span>
                            <span className="font-mono text-xs text-gray-400">{item.numberRange}</span>
                          </div>
                        );
                      } else { // type === 'single'
                        const ticket = item.tickets[0];
                        return (
                          <button
                            key={item.id}
                            onClick={() => openDetailModal(ticket)}
                            className="bg-gray-800 text-left w-full p-2 rounded-md hover:bg-gray-900 transition-colors"
                          >
                            <span className="font-mono text-sm text-indigo-300">{item.label}</span>
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
      ) : (
        <UserPurchaseOrders
          purchaseOrders={purchaseOrders}
          raffles={raffles}
          userId={userId}
        />
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