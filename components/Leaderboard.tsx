import React from 'react';
import { TrophyIcon } from './icons';

interface LeaderboardProps {
    title: string;
    subtitle: string;
    data: { id: string; name: string; amount: number; isCurrentUser?: boolean }[];
    icon: React.FC<{className?: string}>;
    colorClass: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ title, subtitle, data, icon: Icon, colorClass }) => {
    
    const podiumBadgeClasses = [
        'bg-yellow-300 text-yellow-900 ring-2 ring-yellow-100', // 1st
        'bg-slate-200 text-slate-800 ring-2 ring-slate-50',     // 2nd
        'bg-amber-600 text-amber-50 ring-2 ring-amber-300'      // 3rd
    ];

    return (
        <div className="bg-blue-900 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
                <Icon className={`h-8 w-8 mr-3 ${colorClass}`} />
                <div>
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <p className="text-sm text-white">{subtitle}</p>
                </div>
            </div>
            
            <ul className="space-y-3">
                {data.length > 0 ? data.map((user, index) => (
                    <li key={user.id} className={`flex items-center p-3 rounded-md transition-all duration-300 ${user.isCurrentUser ? 'bg-indigo-600/30 ring-2 ring-indigo-500' : 'bg-blue-800/60'}`}>
                        <div className="flex items-center w-12">
                            {index < 3 ? (
                                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${podiumBadgeClasses[index]}`}>
                                    <TrophyIcon className="h-5 w-5"/>
                                </span>
                            ) : (
                                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-blue-950 text-sm font-extrabold text-blue-100 ring-1 ring-blue-400/70 px-2">
                                    {index + 1}
                                </span>
                            )}
                        </div>
                        <span className="flex-grow font-medium text-white">{user.name}</span>
                        <span className={`font-bold text-lg ${colorClass}`}>
                            ${user.amount.toLocaleString()}
                        </span>
                    </li>
                )) : (
                     <p className="text-blue-200 text-center py-8">No hay datos suficientes para mostrar.</p>
                )}
            </ul>
        </div>
    );
};

export default Leaderboard;
