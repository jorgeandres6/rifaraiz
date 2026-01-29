
import React, { useState } from 'react';
import { Raffle, TicketPack, ExtraPrize, User } from '../types';
import { XIcon, TrashIcon, PlusCircleIcon, InformationCircleIcon, BuildingStoreIcon } from './icons';

interface EditRaffleModalProps {
  raffle: Raffle;
  onClose: () => void;
  onUpdateRaffle: (raffle: Raffle) => void;
  users: User[];
}

type PackState = {
    quantity: string;
    price: string;
    participationBonusPercent: string;
    isFidelityPack: boolean;
};

const EditRaffleModal: React.FC<EditRaffleModalProps> = ({ raffle, onClose, onUpdateRaffle, users }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState({
        title: raffle.title,
        description: raffle.description,
        prizeInfo: raffle.prizeInfo,
        ticketPrice: raffle.ticketPrice,
        salesGoal: raffle.salesGoal || '',
        goalThresholdPercent: raffle.goalThresholdPercent || '',
    });
    const [packs, setPacks] = useState<PackState[]>(
        raffle.ticketPacks?.map(p => ({
            quantity: String(p.quantity),
            price: String(p.price),
            participationBonusPercent: String(p.participationBonusPercent || ''),
            isFidelityPack: !!p.isFidelityPack
        })) || [{ quantity: '', price: '', participationBonusPercent: '', isFidelityPack: false }]
    );
    const [extraPrizes, setExtraPrizes] = useState<ExtraPrize[]>(raffle.extraPrizes || []);
    const [newPrizeName, setNewPrizeName] = useState('');
    const [newPrizeQuantity, setNewPrizeQuantity] = useState('');

    // Fidelity State
    const [associatedBusinesses, setAssociatedBusinesses] = useState<string[]>(raffle.associatedBusinesses || []);
    const [newBusinessEmail, setNewBusinessEmail] = useState('');
    const [fidelityError, setFidelityError] = useState('');

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };
    
    const handlePackChange = (index: number, field: keyof PackState, value: string) => {
        const newPacks = [...packs];
        if (field === 'isFidelityPack') return; // Handled by separate toggle
        // Allow numbers with up to 2 decimal places
        if (/^\d*(\.\d{0,2})?$/.test(value)) {
            // @ts-ignore
            newPacks[index][field] = value;
            setPacks(newPacks);
        }
    };

    const handleFidelityToggle = (index: number) => {
        const newPacks = [...packs];
        newPacks[index].isFidelityPack = !newPacks[index].isFidelityPack;
        setPacks(newPacks);
    };
    
    const handleAddPack = () => {
        setPacks([...packs, { quantity: '', price: '', participationBonusPercent: '', isFidelityPack: false }]);
    };
    
    const handleRemovePack = (index: number) => {
        const newPacks = packs.filter((_, i) => i !== index);
        if (newPacks.length === 0) {
            setPacks([{ quantity: '', price: '', participationBonusPercent: '', isFidelityPack: false }]);
        } else {
            setPacks(newPacks);
        }
    };
    
    const handleAddExtraPrize = () => {
        if (newPrizeName.trim() && !isNaN(Number(newPrizeQuantity)) && Number(newPrizeQuantity) > 0) {
            const newPrize: ExtraPrize = {
                id: `ep${Date.now()}`,
                name: newPrizeName.trim(),
                quantity: Number(newPrizeQuantity),
            };
            setExtraPrizes(prev => [...prev, newPrize]);
            setNewPrizeName('');
            setNewPrizeQuantity('');
        }
    };

    const handleRemoveExtraPrize = (prizeId: string) => {
        setExtraPrizes(prev => prev.filter(p => p.id !== prizeId));
    };

    const handleAddBusiness = () => {
        setFidelityError('');
        const trimmedEmail = newBusinessEmail.trim().toLowerCase();
        
        if (!trimmedEmail) {
            setFidelityError('Por favor ingrese un correo electrónico.');
            return;
        }

        const user = users.find(u => u.email.toLowerCase() === trimmedEmail);

        if (!user) {
            setFidelityError('No existe ningún usuario registrado con este correo electrónico.');
            return;
        }

        const identifier = user.name; // Storing the name to display nicely in RaffleCard

        if (associatedBusinesses.includes(identifier)) {
             setFidelityError('Este usuario/negocio ya está asociado a esta rifa.');
             return;
        }

        setAssociatedBusinesses(prev => [...prev, identifier]);
        setNewBusinessEmail('');
    };

    const handleRemoveBusiness = (index: number) => {
        setAssociatedBusinesses(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedTicketPacks: TicketPack[] = packs
            .filter(p => p.quantity && p.price)
            .map(p => ({
                quantity: Number(p.quantity),
                // Round to 2 decimals to avoid floating point issues
                price: Math.round(Number(p.price) * 100) / 100,
                ...(p.participationBonusPercent && { participationBonusPercent: Number(p.participationBonusPercent) }),
                isFidelityPack: p.isFidelityPack
            }));

        const updatedRaffle: Raffle = {
            ...raffle,
            title: formData.title,
            description: formData.description,
            prizeInfo: formData.prizeInfo,
            ticketPrice: formData.ticketPrice,
            salesGoal: formData.salesGoal ? Number(formData.salesGoal) : undefined,
            goalThresholdPercent: formData.goalThresholdPercent ? Number(formData.goalThresholdPercent) : undefined,
            ticketPacks: updatedTicketPacks,
            extraPrizes: extraPrizes,
            associatedBusinesses: associatedBusinesses
        };
        onUpdateRaffle(updatedRaffle);
    };

    const getTabClass = (tabName: string) => {
        return `py-2 px-4 font-medium text-sm rounded-t-md transition-colors ${
            activeTab === tabName
                ? 'bg-gray-800 text-indigo-400'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white'
        }`;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl relative transform transition-all max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full bg-gray-800 rounded-lg">
                    <div className="p-6 pb-0 border-b border-gray-700">
                        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                            <XIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold text-indigo-400">Gestionar Rifa</h2>
                        <p className="text-gray-400 mt-1 mb-4">Editando: <span className="font-semibold">{raffle.title}</span></p>
                         <div className="flex space-x-2 border-b-2 border-gray-700 -mb-px overflow-x-auto">
                            <button type="button" onClick={() => setActiveTab('general')} className={getTabClass('general')}>
                                Datos Generales
                            </button>
                            <button type="button" onClick={() => setActiveTab('prizes')} className={getTabClass('prizes')}>
                                Premios Extra
                            </button>
                            <button type="button" onClick={() => setActiveTab('fidelity')} className={getTabClass('fidelity')}>
                                Rifa Fidelity
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-4 overflow-y-auto">
                        {activeTab === 'general' && (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">Título</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleFormChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descripción</label>
                                    <textarea name="description" value={formData.description} onChange={handleFormChange} rows={3} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="prizeInfo" className="block text-sm font-medium text-gray-300">Premio</label>
                                        <input type="text" name="prizeInfo" value={formData.prizeInfo} onChange={handleFormChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2" />
                                    </div>
                                    <div>
                                        <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-300">Precio Boleto ($)</label>
                                        <input type="number" name="ticketPrice" step="0.01" value={formData.ticketPrice} onChange={handleFormChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2" min="0.01" />
                                    </div>
                                    <div>
                                        <label htmlFor="salesGoal" className="block text-sm font-medium text-gray-300">Meta Ventas ($) <span className="text-xs text-gray-500">(opcional)</span></label>
                                        <input type="number" name="salesGoal" value={formData.salesGoal} onChange={handleFormChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2" min="1" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="goalThresholdPercent" className="block text-sm font-medium text-gray-300">Meta a Mostrar (%) <span className="text-xs text-gray-500">(opcional)</span></label>
                                    <div className="relative group inline-block w-full">
                                        <input type="number" name="goalThresholdPercent" value={formData.goalThresholdPercent} onChange={handleFormChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2" min="1" max="100" />
                                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-gray-600 shadow-lg">
                                            Porcentaje de la meta de ventas que se muestra públicamente en la carta de la rifa.
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-700 pt-4">
                                     <div className="flex items-center space-x-2">
                                        <label className="block text-sm font-medium text-gray-300">Packs de Boletos</label>
                                         <div className="relative group">
                                            <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-pointer" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-gray-600 shadow-lg">
                                                Define un % de las ventas totales de esta rifa que se repartirá como premio entre todos los compradores de este pack.
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-600"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-1">
                                        {packs.map((pack, index) => (
                                            <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 bg-gray-900/50 p-2 rounded-md border border-gray-700">
                                                <div className="flex items-center gap-2 flex-grow">
                                                    <input type="text" placeholder="Cantidad" value={pack.quantity} onChange={(e) => handlePackChange(index, 'quantity', e.target.value)} className="w-full md:w-20 bg-gray-800 border border-gray-600 rounded-md p-2" />
                                                    <span className="text-gray-400">por $</span>
                                                    <input type="number" step="0.01" min="0.01" placeholder="Precio" value={pack.price} onChange={(e) => handlePackChange(index, 'price', e.target.value)} className="w-full md:w-24 bg-gray-800 border border-gray-600 rounded-md p-2" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">Bonus:</span>
                                                    <input type="text" placeholder="%" value={pack.participationBonusPercent} onChange={(e) => handlePackChange(index, 'participationBonusPercent', e.target.value)} className="w-16 bg-gray-800 border border-gray-600 rounded-md p-2" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFidelityToggle(index)}
                                                        className={`p-2 rounded-md border transition-colors ${pack.isFidelityPack ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-purple-400'}`}
                                                        title="Marcar como Pack Fidelity (da acceso a rifa fidelity)"
                                                    >
                                                        <BuildingStoreIcon className="h-5 w-5" />
                                                    </button>
                                                    <button type="button" onClick={() => handleRemovePack(index)} className="p-2 text-gray-400 hover:text-red-400"><XIcon className="h-5 w-5" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={handleAddPack} className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold">+ Agregar otro pack</button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'prizes' && (
                            <div>
                                <h4 className="text-md font-semibold text-white mb-2">Premios Extra</h4>
                                <div className="bg-gray-900/50 rounded-md border border-gray-700 max-h-48 overflow-y-auto">
                                    <table className="w-full text-sm text-left text-gray-300">
                                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                                            <tr>
                                                <th scope="col" className="px-4 py-2">Nombre del Premio</th>
                                                <th scope="col" className="px-4 py-2">Cantidad</th>
                                                <th scope="col" className="px-4 py-2"><span className="sr-only">Acciones</span></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {extraPrizes.length > 0 ? extraPrizes.map(prize => (
                                                <tr key={prize.id} className="border-b border-gray-700">
                                                    <td className="px-4 py-2">{prize.name}</td>
                                                    <td className="px-4 py-2">{prize.quantity}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button type="button" onClick={() => handleRemoveExtraPrize(prize.id)} className="text-gray-400 hover:text-red-400"><TrashIcon className="h-5 w-5"/></button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={3} className="text-center py-4 text-gray-500">No hay premios extra para esta rifa.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-end gap-2 mt-3">
                                    <div className="flex-grow">
                                        <label htmlFor="newPrizeName" className="text-xs text-gray-400">Nombre del Premio</label>
                                        <input id="newPrizeName" type="text" placeholder="Ej: Bono de $10" value={newPrizeName} onChange={e => setNewPrizeName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm" />
                                    </div>
                                    <div className="w-28">
                                        <label htmlFor="newPrizeQuantity" className="text-xs text-gray-400">Cantidad</label>
                                        <input id="newPrizeQuantity" type="number" placeholder="10" value={newPrizeQuantity} onChange={e => setNewPrizeQuantity(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm" min="1" />
                                    </div>
                                    <button type="button" onClick={handleAddExtraPrize} className="flex items-center bg-green-600 text-white font-bold py-2 px-3 rounded-md hover:bg-green-700 text-sm"><PlusCircleIcon className="h-5 w-5 mr-1"/> Agregar</button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'fidelity' && (
                            <div>
                                <div className="flex items-center mb-4 text-purple-300">
                                    <BuildingStoreIcon className="h-5 w-5 mr-2" />
                                    <h4 className="text-md font-semibold">Configuración Rifa Fidelity</h4>
                                </div>
                                <div className="bg-purple-900/20 border border-purple-500/30 rounded-md p-4 mb-4">
                                    <p className="text-xs text-gray-300 mb-2">
                                        Al agregar usuarios/negocios asociados, se creará automáticamente una versión "Fidelity" de esta rifa visible para todos, cuya participación será exclusiva a través de ellos.
                                    </p>
                                </div>

                                <div className="bg-gray-900/50 rounded-md border border-gray-700 max-h-48 overflow-y-auto mb-3">
                                    <table className="w-full text-sm text-left text-gray-300">
                                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                                            <tr>
                                                <th scope="col" className="px-4 py-2">Negocio/Usuario Asociado</th>
                                                <th scope="col" className="px-4 py-2 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {associatedBusinesses.length > 0 ? associatedBusinesses.map((business, index) => (
                                                <tr key={index} className="border-b border-gray-700">
                                                    <td className="px-4 py-2 flex items-center">
                                                        <BuildingStoreIcon className="h-4 w-4 mr-2 text-purple-400" />
                                                        {business}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button type="button" onClick={() => handleRemoveBusiness(index)} className="text-gray-400 hover:text-red-400"><TrashIcon className="h-4 w-4"/></button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={2} className="text-center py-4 text-gray-500">No hay negocios asociados. La Rifa Fidelity estará desactivada.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <label htmlFor="newBusinessEmail" className="text-xs text-gray-400">Correo del Usuario/Negocio</label>
                                        <input 
                                            id="newBusinessEmail" 
                                            type="email" 
                                            placeholder="ejemplo@correo.com" 
                                            value={newBusinessEmail} 
                                            onChange={e => setNewBusinessEmail(e.target.value)} 
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-purple-500 focus:border-purple-500" 
                                        />
                                    </div>
                                    <button type="button" onClick={handleAddBusiness} className="flex items-center bg-purple-600 text-white font-bold py-2 px-3 rounded-md hover:bg-purple-700 text-sm">
                                        <PlusCircleIcon className="h-5 w-5 mr-1"/> Agregar
                                    </button>
                                </div>
                                {fidelityError && <p className="text-xs text-red-400 mt-2">{fidelityError}</p>}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-gray-800 border-t border-gray-700 mt-auto flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRaffleModal;
