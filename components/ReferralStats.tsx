import React, { useMemo } from 'react';
import { User, Ticket, Raffle } from '../types';
import { UsersIcon, CurrencyDollarIcon, ShareIcon } from './icons';

interface ReferralStatsProps {
    currentUser: User;
    users: User[];
    tickets: Ticket[];
    raffles: Raffle[];
}

const ReferralStats: React.FC<ReferralStatsProps> = ({ currentUser, users, tickets, raffles }) => {
    // Defensive: if currentUser isn't available yet, don't try to compute network stats
    if (!currentUser) return null;

    const networkStats = useMemo(() => {
        const rafflePriceMap = raffles.reduce((acc, r) => {
            acc[r.id] = r.ticketPrice;
            return acc;
        }, {} as Record<string, number>);

        const directReferrals = users.filter(u => u && u.referredBy === currentUser.id);
        
        // Build complete downline recursively (direct + all indirect referrals)
        const getAllDownline = (userId: string): User[] => {
            const direct = users.filter(u => u && u.referredBy === userId);
            const indirect = direct.flatMap(u => getAllDownline(u.id));
            return [...direct, ...indirect];
        };

        const fullDownline = getAllDownline(currentUser.id);
        // Remove duplicates using Map
        const uniqueDownline = Array.from(new Map(fullDownline.map(u => [u.id, u])).values());
        const downlineIds = uniqueDownline.map(u => u.id);
        const networkTickets = tickets.filter(t => downlineIds.includes(t.userId));
        
        console.log('🔍 DEBUG Red de Referidos:', {
            currentUserId: currentUser.id,
            currentUserName: currentUser.name,
            directReferralsCount: directReferrals.length,
            directReferralsNames: directReferrals.map(u => u.name),
            totalNetworkSize: uniqueDownline.length,
            downlineNames: uniqueDownline.map(u => u.name),
        });
        
        const totalNetworkSales = networkTickets.reduce((sum, ticket) => {
            // NOTE: This is an approximation based on ticketPrice.
            // A more accurate calculation would require storing purchase price on the ticket object.
            return sum + (rafflePriceMap[ticket.raffleId] || 0);
        }, 0);

        return {
            directReferrals,
            totalNetworkSize: uniqueDownline.length,
            totalNetworkSales,
        };
    }, [currentUser, users, tickets, raffles]);

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-indigo-400 mb-4">Estadísticas de mi Red</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                        <UsersIcon className="h-8 w-8 mx-auto text-indigo-400 mb-2"/>
                        <p className="text-sm text-gray-400">Referidos Directos</p>
                        <p className="text-2xl font-bold text-white">{networkStats.directReferrals.length}</p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                        <ShareIcon className="h-8 w-8 mx-auto text-purple-400 mb-2"/>
                        <p className="text-sm text-gray-400">Tamaño Total de Red</p>
                        <p className="text-2xl font-bold text-white">{networkStats.totalNetworkSize}</p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                        <CurrencyDollarIcon className="h-8 w-8 mx-auto text-green-400 mb-2"/>
                        <p className="text-sm text-gray-400">Ventas de tu Red</p>
                        <p className="text-2xl font-bold text-white">${networkStats.totalNetworkSales.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="font-semibold text-white mb-2">Mis Referidos Directos</h4>
                {networkStats.directReferrals.length === 0 ? (
                    <p className="text-gray-400 text-center py-4 bg-gray-900/50 rounded-md">Aún no tienes referidos directos.</p>
                ) : (
                    <div className="overflow-x-auto max-h-60 bg-gray-900/50 rounded-md border border-gray-700">
                       <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Nombre</th>
                                    <th scope="col" className="px-4 py-3">Correo Electrónico</th>
                                    <th scope="col" className="px-4 py-3">Cód. Referido</th>
                                </tr>
                            </thead>
                            <tbody>
                                {networkStats.directReferrals.map(user => (
                                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                        <td className="px-4 py-2 font-medium text-white">{user.name || user.email || '-'}</td>
                                        <td className="px-4 py-2">{user.email || '-'}</td>
                                        <td className="px-4 py-2 font-mono">{user.referralCode || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                       </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferralStats;
