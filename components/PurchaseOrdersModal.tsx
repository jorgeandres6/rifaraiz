import React, { useState, useMemo } from 'react';
import { PurchaseOrder, User, Raffle, PurchaseOrderStatus } from '../types';
import { PurchaseOrders, RouletteChances } from '../services/firestore';
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

  const filteredOrders = useMemo(
    () => purchaseOrders.filter(order => order.status === activeTab),
    [purchaseOrders, activeTab]
  );

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Usuario desconocido';
  };

  const getRaffleName = (raffleId: string) => {
    return raffles.find(r => r.id === raffleId)?.title || 'Rifa desconocida';
  };

  const handleVerifyOrder = async (order: PurchaseOrder) => {
    // Simulating ticket generation - in real implementation this would create actual tickets
    setGeneratingTickets(true);
    try {
      // Generate ticket IDs (normally these would come from ticket creation)
      const ticketIds = Array.from({ length: order.quantity }, (_, i) =>
        `TICKET-${order.id}-${i + 1}`
      );
      setTicketsGenerated(ticketIds);

      // Update order in Firestore
      await PurchaseOrders.verify(order.id, ticketIds, currentUser.id);

      // Increment roulette chances for the user based on quantity
      await RouletteChances.incrementChances(order.userId, order.raffleId, order.quantity);

      if (onVerifyOrder) {
        onVerifyOrder(order.id, ticketIds);
      }

      // Refresh by deselecting
      setSelectedOrder(null);
      setTicketsGenerated([]);
    } catch (error) {
      console.error('Error verifying order:', error);
      alert('Error al verificar la orden');
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
    try {
      await PurchaseOrders.markAsPaid(order.id, currentUser.id);

      if (onMarkAsPaid) {
        onMarkAsPaid(order.id);
      }

      setSelectedOrder(null);
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
                    <p className="text-xs text-gray-500 uppercase font-semibold">ID de Orden</p>
                    <p className="text-lg font-bold text-gray-900">{selectedOrder.id}</p>
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
                      {new Date(selectedOrder.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  {selectedOrder.paidAt && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Fecha de Pago</p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(selectedOrder.paidAt).toLocaleDateString('es-ES')}
                      </p>
                      {selectedOrder.paidByAdminId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Por: {getUserName(selectedOrder.paidByAdminId)}
                        </p>
                      )}
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
                    <button
                      onClick={() => handleMarkAsPaid(selectedOrder)}
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
                )}

                {selectedOrder.status === 'PAID' && (
                  <>
                    <button
                      onClick={() => handleVerifyOrder(selectedOrder)}
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
                    <div className="grid grid-cols-5 gap-4 items-center">
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
                          {new Date(order.createdAt).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                          })}
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
