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
    
    const rankColors = [
        'text-yellow-400', // 1st
        'text-gray-300',   // 2nd
        'text-yellow-600'  // 3rd
    ];

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
                <Icon className={`h-8 w-8 mr-3 ${colorClass}`} />
                <div>
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <p className="text-sm text-gray-400">{subtitle}</p>
                </div>
            </div>
            
            <ul className="space-y-3">
                {data.length > 0 ? data.map((user, index) => (
                    <li key={user.id} className={`flex items-center p-3 rounded-md transition-all duration-300 ${user.isCurrentUser ? 'bg-indigo-600/30 ring-2 ring-indigo-500' : 'bg-gray-700/50'}`}>
                        <div className="flex items-center w-12">
                            {index < 3 ? (
                                <TrophyIcon className={`h-6 w-6 ${rankColors[index]}`}/>
                            ) : (
                                <span className="text-lg font-bold text-gray-500">{index + 1}</span>
                            )}
                        </div>
                        <span className="flex-grow font-medium text-white">{user.name}</span>
                        <span className={`font-bold text-lg ${colorClass}`}>
                            ${user.amount.toLocaleString()}
                        </span>
                    </li>
                )) : (
                     <p className="text-gray-500 text-center py-8">No hay datos suficientes para mostrar.</p>
                )}
            </ul>
        </div>
    );
};

export default Leaderboard;
