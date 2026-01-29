import React, { useState, useMemo } from 'react';
import { PurchaseOrder, User, Raffle, PurchaseOrderStatus, Ticket } from '../types';
import { PurchaseOrders, RouletteChances, Tickets } from '../services/firestore';
import { XIcon, CheckCircleIcon, ExclamationTriangleIcon, DocumentTextIcon, ClockIcon } from './icons';

interface PurchaseOrdersModalProps {
  onClose: () => void;
  purchaseOrders: PurchaseOrder[];
  users: User[];
  raffles: Raffle[];
  currentUser: User;
  onVerifyOrder?: (orderId: string, ticketIds: string[]) => void;
  onRejectOrder?: (orderId: string, reason: string) => void;
  onMarkAsPaid?: (orderId: string) => void;
}

const PurchaseOrdersModal: React.FC<PurchaseOrdersModalProps> = ({
  onClose,
  purchaseOrders,
  users,
  raffles,
  currentUser,
  onVerifyOrder,
  onRejectOrder,
  onMarkAsPaid,
}) => {
  const [activeTab, setActiveTab] = useState<PurchaseOrderStatus>('PENDING');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [generatingTickets, setGeneratingTickets] = useState(false);
  const [ticketsGenerated, setTicketsGenerated] = useState<string[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  const filteredOrders = useMemo(
    () => purchaseOrders.filter(order => {
      const matchesTab = order.status === activeTab;
      const matchesSearch = !searchCode || (order.orderCode || '').toLowerCase().includes(searchCode.toLowerCase());
      return matchesTab && matchesSearch;
    }),
    [purchaseOrders, activeTab, searchCode]
  );

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Usuario desconocido';
  };

  const getRaffleName = (raffleId: string) => {
    return raffles.find(r => r.id === raffleId)?.title || 'Rifa desconocida';
  };

  const handleVerifyOrder = async (order: PurchaseOrder) => {
    setGeneratingTickets(true);
    try {
      const raffle = raffles.find(r => r.id === order.raffleId);
      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }

      // Get the user's referral code
      const user = users.find(u => u.id === order.userId);
      const userReferralCode = user?.referralCode || 'UNKNOWN';

      // Generate ticket IDs and create ticket objects
      const ticketIds: string[] = [];
      const ticketsToCreate: Partial<Ticket>[] = [];

      for (let i = 0; i < order.quantity; i++) {
        const ticketId = `t_${order.id}_${i + 1}`;
        const ticketNumber = `${userReferralCode}-${i + 1}`;
        
        ticketIds.push(ticketId);
        ticketsToCreate.push({
          id: ticketId,
          raffleId: order.raffleId,
          userId: order.userId,
          purchaseDate: new Date(),
          ticketNumber: ticketNumber,
          originalUserId: order.userId,
          transferCount: 0,
          purchasedPackInfo: order.packId ? {
            quantity: order.quantity,
            price: order.totalPrice / order.quantity,
          } : undefined,
        });
      }

      setTicketsGenerated(ticketIds);

      // Create all tickets in batch
      if (ticketsToCreate.length > 0) {
        await Tickets.addBatch(ticketsToCreate);
      }

      // Update order in Firestore with verification
      await PurchaseOrders.verify(order.id, ticketIds, currentUser.id, verificationNotes);

      // Check if raffle has available prizes before granting roulette chances
      const hasPrizes = raffle.extraPrizes && raffle.extraPrizes.some(prize => prize.quantity > 0);
      
      if (hasPrizes) {
        // Increment roulette chances for the user based on quantity
        await RouletteChances.incrementChances(order.userId, order.raffleId, order.quantity);
      } else {
        console.log('No hay premios disponibles para esta rifa, no se asignaron oportunidades de ruleta');
      }

      if (onVerifyOrder) {
        onVerifyOrder(order.id, ticketIds);
      }

      // Refresh by deselecting
      setSelectedOrder(null);
      setTicketsGenerated([]);
      setShowVerificationForm(false);
      setVerificationNotes('');
    } catch (error) {
      console.error('Error verifying order:', error);
      alert('Error al verificar la orden: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setGeneratingTickets(false);
    }
  };

  const handleRejectOrder = async (order: PurchaseOrder) => {
    if (!rejectReason.trim()) {
      alert('Por favor indica una razón para rechazar');
      return;
    }

    try {
      await PurchaseOrders.reject(order.id, rejectReason, currentUser.id);

      if (onRejectOrder) {
        onRejectOrder(order.id, rejectReason);
      }

      setShowRejectForm(false);
      setRejectReason('');
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Error al rechazar la orden');
    }
  };

  const handleMarkAsPaid = async (order: PurchaseOrder) => {
    if (!paymentMethod.trim()) {
      alert('Por favor, selecciona un método de pago');
      return;
    }

    try {
      await PurchaseOrders.markAsPaid(order.id, currentUser.id, paymentMethod, paymentNotes);

      if (onMarkAsPaid) {
        onMarkAsPaid(order.id);
      }

      setSelectedOrder(null);
      setShowPaymentForm(false);
      setPaymentMethod('');
      setPaymentNotes('');
    } catch (error) {
      console.error('Error marking order as paid:', error);
      alert('Error al marcar como pagado');
    }
  };

  const getStatusBadgeColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-blue-100 text-blue-800';
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: PurchaseOrderStatus) => {
    const labels: Record<PurchaseOrderStatus, string> = {
      PENDING: 'Por Pagar',
      PAID: 'Pagado',
      VERIFIED: 'Verificado',
      REJECTED: 'Rechazado',
      CANCELLED: 'Cancelado',
    };
    return labels[status];
  };

  const tabs = ['PENDING', 'PAID', 'VERIFIED', 'REJECTED', 'CANCELLED'] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-6 h-6" />
            <h2 className="text-xl font-bold">Órdenes de Compra</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedOrder(null);
                setShowRejectForm(false);
              }}
              className={`flex-1 py-3 px-4 font-medium text-center border-b-2 transition ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {getStatusLabel(tab as PurchaseOrderStatus)}
              <span className="ml-2 text-sm">
                ({purchaseOrders.filter(o => o.status === tab).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        {!selectedOrder && (
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 border-b-2 border-indigo-800">
            <input
              type="text"
              placeholder="Buscar por código de orden (ej: ORD-20260128-ABCD1234)..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white font-semibold"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {selectedOrder ? (
            // Detail View
            <div className="space-y-6">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                ← Volver a la lista
              </button>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Código de Orden</p>
                    <p className="text-lg font-bold text-indigo-600 font-mono">{selectedOrder.orderCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">ID de Orden</p>
                    <p className="text-sm font-mono text-gray-600">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Usuario</p>
                    <p className="text-lg font-bold text-gray-900">
                      {getUserName(selectedOrder.userId)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Rifa</p>
                    <p className="text-lg font-bold text-gray-900">
                      {getRaffleName(selectedOrder.raffleId)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Estado</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                </div>

                <hr className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Cantidad de Boletos</p>
                    <p className="text-lg font-bold text-gray-900">{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Precio Total</p>
                    <p className="text-lg font-bold text-green-600">${selectedOrder.totalPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Fecha de Creación</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                  {selectedOrder.paidAt && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Fecha de Pago</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                      </p>
                      {selectedOrder.paidByAdminId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Por: {getUserName(selectedOrder.paidByAdminId)}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedOrder.paymentMethod && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Método de Pago</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedOrder.paymentMethod === 'deposito' && 'Depósito Bancario'}
                        {selectedOrder.paymentMethod === 'transferencia' && 'Transferencia'}
                        {selectedOrder.paymentMethod === 'efectivo' && 'Efectivo'}
                        {selectedOrder.paymentMethod === 'cheque' && 'Cheque'}
                        {selectedOrder.paymentMethod === 'otro' && 'Otro'}
                      </p>
                    </div>
                  )}
                  {selectedOrder.paymentNotes && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Observaciones de Pago</p>
                      <p className="text-lg font-bold text-gray-900 break-words">
                        {selectedOrder.paymentNotes}
                      </p>
                    </div>
                  )}
                </div>

                {selectedOrder.ticketIds && selectedOrder.ticketIds.length > 0 && (
                  <>
                    <hr className="my-4" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-3">IDs de Boletos Asignados</p>
                      {selectedOrder.verifiedByAdminId && (
                        <p className="text-xs text-gray-600 mb-2">
                          Verificado por: <span className="font-semibold">{getUserName(selectedOrder.verifiedByAdminId)}</span>
                        </p>
                      )}
                      <div className="bg-white p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {selectedOrder.ticketIds.map((ticketId, idx) => (
                            <p key={idx} className="text-sm text-gray-700 font-mono">
                              {ticketId}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedOrder.verificationNotes && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Notas de Verificación</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200 break-words">
                          {selectedOrder.verificationNotes}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {selectedOrder.rejectionReason && (
                  <>
                    <hr className="my-4" />
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-xs text-red-700 uppercase font-semibold mb-2">Motivo del Rechazo</p>
                      <p className="text-red-700">{selectedOrder.rejectionReason}</p>
                      {selectedOrder.rejectedByAdminId && (
                        <p className="text-xs text-red-600 mt-2">
                          Rechazado por: <span className="font-semibold">{getUserName(selectedOrder.rejectedByAdminId)}</span>
                        </p>
                      )}
                    </div>
                  </>
                )}

                {ticketsGenerated.length > 0 && (
                  <>
                    <hr className="my-4" />
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="flex items-center gap-2 text-green-700 font-semibold mb-3">
                        <CheckCircleIcon className="w-5 h-5" />
                        Boletos Generados Exitosamente
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {ticketsGenerated.map((id, idx) => (
                          <p key={idx} className="text-sm text-green-700 font-mono">
                            {id}
                          </p>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {selectedOrder.status === 'PENDING' && (
                  <>
                    {!showPaymentForm ? (
                      <>
                        <button
                          onClick={() => setShowPaymentForm(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                        >
                          Marcar como Pagado
                        </button>
                        {!showRejectForm && (
                          <button
                            onClick={() => setShowRejectForm(true)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
                          >
                            Rechazar Orden
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-4">
                        <h4 className="font-bold text-gray-900 mb-3">Registrar Pago</h4>
                        
                        {/* Payment Method */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Método de Pago *
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="">Selecciona un método...</option>
                            <option value="deposito">Depósito Bancario</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="cheque">Cheque</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>

                        {/* Payment Notes */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Observaciones (Número de depósito, referencia, etc.)
                          </label>
                          <textarea
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            placeholder="Ej: Depósito #12345, Transferencia a Juan, Efectivo recibido por María..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                            rows={3}
                          />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkAsPaid(selectedOrder)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
                          >
                            Confirmar Pago
                          </button>
                          <button
                            onClick={() => {
                              setShowPaymentForm(false);
                              setPaymentMethod('');
                              setPaymentNotes('');
                            }}
                            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedOrder.status === 'PAID' && (
                  <>
                    {!showVerificationForm ? (
                      <>
                        <button
                          onClick={() => setShowVerificationForm(true)}
                          disabled={generatingTickets}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {generatingTickets ? (
                            <>
                              <span className="animate-spin">⟳</span>
                              Generando boletos...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-5 h-5" />
                              Verificar y Asignar Boletos
                            </>
                          )}
                        </button>
                        {!showRejectForm && (
                          <button
                            onClick={() => setShowRejectForm(true)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
                          >
                            Rechazar Orden
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-4">
                        <h4 className="font-bold text-gray-900 mb-3">Verificación de Orden</h4>
                        
                        {/* Verification Notes */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Notas de Verificación (Opcional)
                          </label>
                          <textarea
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            placeholder="Ej: Boletos verificados, revisados y listos para entrega. Documentación completa..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                            rows={3}
                          />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerifyOrder(selectedOrder)}
                            disabled={generatingTickets}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {generatingTickets ? (
                              <>
                                <span className="animate-spin">⟳</span>
                                Procesando...
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="w-4 h-4" />
                                Confirmar Verificación
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowVerificationForm(false);
                              setVerificationNotes('');
                            }}
                            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {showRejectForm && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <p className="text-red-700 font-semibold flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                      Razón para rechazar
                    </p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Indica el motivo del rechazo..."
                      className="w-full border border-red-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRejectOrder(selectedOrder)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
                      >
                        Confirmar Rechazo
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectReason('');
                        }}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // List View
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">
                    No hay órdenes en estado "{getStatusLabel(activeTab)}"
                  </p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer hover:border-purple-300"
                  >
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Código</p>
                        <p className="font-bold text-indigo-600 font-mono truncate">
                          {order.orderCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Usuario</p>
                        <p className="font-bold text-gray-900 truncate">
                          {getUserName(order.userId)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Rifa</p>
                        <p className="font-bold text-gray-900 truncate">
                          {getRaffleName(order.raffleId)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Cantidad</p>
                        <p className="font-bold text-gray-900">{order.quantity} boletos</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Monto</p>
                        <p className="font-bold text-green-600">${order.totalPrice.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Creada</p>
                        <p className="text-sm text-gray-700">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersModal;
