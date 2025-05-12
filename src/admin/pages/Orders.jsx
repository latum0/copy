import React, { useState, useEffect } from 'react';
import './Orders.css';
import axios from 'axios';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const response = await axios.get('http://localhost:5000/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const ordersData = response.data.data || response.data;
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        
      } catch (error) {
        console.error('API Error:', {
          config: error.config,
          response: error.response,
          message: error.message
        });
        
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          setError(error.response?.data?.message || 
                 'Erreur lors de la récupération des commandes');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, []);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/orders/${selectedOrder._id}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setOrders(orders.map(order => 
        order._id === selectedOrder._id 
          ? { ...order, status: 'Cancelled' } 
          : order
      ));
      
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError('Erreur lors de l\'annulation de la commande');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.name && order.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.user?.email && order.user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || 
                          (order.payment && order.payment.method === paymentFilter);
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'status-badge status-success';
      case 'shipped': 
      case 'paid': return 'status-badge status-shipped';
      case 'processing': return 'status-badge status-preparing';
      case 'pending': return 'status-badge status-pending';
      case 'cancelled': return 'status-badge status-cancelled';
      default: return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      delivered: 'Livrée',
      shipped: 'Expédiée',
      paid: 'Payée',
      processing: 'En préparation',
      pending: 'En attente',
      cancelled: 'Annulée'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const getPaymentMethod = (method) => {
    const paymentMap = {
      credit_card: 'Carte bancaire',
      paypal: 'PayPal',
      bank_transfer: 'Virement bancaire',
      cash: 'Espèces'
    };
    return paymentMap[method] || method || 'Non spécifié';
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading) return <div className="loading">Chargement des commandes...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1 className="page-title">Toutes les Commandes</h1>
      </div>
      
      <div className="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="search-icon">
          <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input 
          type="text" 
          placeholder="Rechercher des commandes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="filters-container">
        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          <option value="Pending">En attente</option>
          <option value="Paid">Payée</option>
          <option value="Shipped">Expédiée</option>
          <option value="Delivered">Livrée</option>
          <option value="Cancelled">Annulée</option>
        </select>
        
        <select 
          className="filter-select"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="all">Tous les paiements</option>
          <option value="credit_card">Carte bancaire</option>
          <option value="paypal">PayPal</option>
          <option value="bank_transfer">Virement bancaire</option>
          <option value="cash">Espèces</option>
        </select>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Commande</th>
              <th>Client</th>
              <th>Date</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Paiement</th>
              <th>Vendeur(s)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <tr key={order._id}>
                  <td>ORD-{order._id.substring(0, 6).toUpperCase()}</td>
                  <td>
                    <div>{order.user?.name || 'Anonyme'}</div>
                    {order.user?.email && (
                      <div className="client-email">{order.user.email}</div>
                    )}
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>€{order.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td>{getPaymentMethod(order.payment?.method)}</td>
                  <td>
                    {order.items?.map((item, index) => (
                      <div key={index}>
                        {item.seller?.name || 'Vendeur inconnu'}
                      </div>
                    ))}
                  </td>
                  <td>
                    <div className={`dropdown ${index >= filteredOrders.length - 2 ? 'dropdown-top' : ''}`}>
                      <button className="action-button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <div className="dropdown-content">
                        <button onClick={() => handleViewDetails(order)}>Voir les détails</button>
                        {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                          <button onClick={() => handleCancelOrder(order)}>Annuler la commande</button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-orders">
                  Aucune commande trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal pour voir les détails */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Détails de la commande ORD-{selectedOrder._id.substring(0, 6).toUpperCase()}</h3>
              <button onClick={() => setShowDetailsModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="order-details-section">
                <h4>Informations client</h4>
                <p><strong>Nom:</strong> {selectedOrder.user?.name || 'Anonyme'}</p>
                <p><strong>Email:</strong> {selectedOrder.user?.email || 'Non spécifié'}</p>
                <p><strong>Adresse:</strong> {selectedOrder.shippingAddress?.address || 'Non spécifié'}</p>
              </div>
              
              <div className="order-details-section">
                <h4>Articles commandés</h4>
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Prix unitaire</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product?.name || 'Produit inconnu'}</td>
                        <td>{item.quantity}</td>
                        <td>€{item.price?.toFixed(2) || '0.00'}</td>
                        <td>€{(item.quantity * item.price)?.toFixed(2) || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="order-details-section">
                <h4>Résumé</h4>
                <p><strong>Sous-total:</strong> €{selectedOrder.subTotal?.toFixed(2) || '0.00'}</p>
                <p><strong>Frais de livraison:</strong> €{selectedOrder.shippingPrice?.toFixed(2) || '0.00'}</p>
                <p><strong>Total:</strong> €{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailsModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour annuler la commande */}
      {showCancelModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Annuler la commande</h3>
              <button onClick={() => setShowCancelModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Êtes-vous sûr de vouloir annuler la commande ORD-{selectedOrder._id.substring(0, 6).toUpperCase()} ?</p>
              <p>Cette action est irréversible.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCancelModal(false)}>Non, garder la commande</button>
              <button className="danger" onClick={confirmCancelOrder}>Oui, annuler la commande</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;