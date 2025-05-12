import React, { useState, useEffect } from 'react';
import './Payments.css';

function VendorPayments() {
  // États pour la gestion des données
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous les statuts');
  const [methodFilter, setMethodFilter] = useState('Toutes les méthodes');
  
  // États pour le formulaire
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorEmail: '',
    amount: '',
    method: 'Virement bancaire',
    reference: generateReference(),
    bankAccount: '',
    description: ''
  });

  // Génération d'une référence aléatoire
  function generateReference() {
    return `PAY-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  // Chargement initial des paiements
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/payments');
        if (!response.ok) throw new Error('Erreur lors de la récupération des paiements');
        const data = await response.json();
        setPayments(data);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
        // En cas d'erreur, charger des données factices pour le développement
        setPayments(getMockVendorPayments());
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Données factices pour le développement
  function getMockVendorPayments() {
    return [
      {
        _id: '1',
        reference: 'PAY-123456',
        vendor: { name: 'Jean Dupont', email: 'jean@example.com', bankAccount: 'FR76 1234 5678 9012 3456 7890 123' },
        amount: 1250.50,
        status: 'Success',
        transactionDate: '2023-05-15T10:30:00Z',
        method: 'Virement bancaire'
      },
      {
        _id: '2',
        reference: 'PAY-789012',
        vendor: { name: 'Marie Martin', email: 'marie@example.com', bankAccount: 'FR76 9876 5432 1098 7654 3210 987' },
        amount: 845.75,
        status: 'Initiated',
        transactionDate: '2023-05-18T14:45:00Z',
        method: 'PayPal'
      }
    ];
  }

  // Fonctions de formatage
  const formatStatus = (status) => {
    const statusMap = {
      'Success': 'Payé',
      'Initiated': 'En attente',
      'Failed': 'Échoué',
      'Refunded': 'Remboursé'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'Success': 'status-paid',
      'Initiated': 'status-waiting',
      'Failed': 'status-failed',
      'Refunded': 'status-refunded'
    };
    return classMap[status] || '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Gestion du formulaire
  const handlePaymentButtonClick = () => {
    setShowPaymentForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      const newPayment = {
        reference: formData.reference,
        vendor: {
          name: formData.vendorName,
          email: formData.vendorEmail,
          bankAccount: formData.bankAccount
        },
        amount: parseFloat(formData.amount),
        status: 'Initiated',
        method: formData.method,
        description: formData.description
      };

      // Envoi à l'API
      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPayment)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du paiement');
      }

      const createdPayment = await response.json();
      
      setPayments(prev => [createdPayment, ...prev]);
      
      setShowPaymentForm(false);
      setFormData({
        vendorName: '',
        vendorEmail: '',
        amount: '',
        method: 'Virement bancaire',
        reference: generateReference(),
        bankAccount: '',
        description: ''
      });

      alert('Paiement créé avec succès!');
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la création du paiement: ' + err.message);
    }
  };

  // Filtrage des paiements
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         payment.vendor?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Tous les statuts' || 
                         formatStatus(payment.status) === statusFilter;
    
    const matchesMethod = methodFilter === 'Toutes les méthodes' || 
                         payment.method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  if (loading) {
    return <div className="payments-page">Chargement des paiements...</div>;
  }

  if (error) {
    return (
      <div className="payments-page">
        <div className="error-message">
          Erreur: {error}. Affichage de données factices à titre d'exemple.
        </div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <div className="page-header">
        <h1 className="page-title">Paiements aux Vendeurs</h1>
        <button className="button button-primary" onClick={handlePaymentButtonClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="button-icon">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Effectuer un paiement
        </button>
      </div>

      {/* Formulaire de paiement modal */}
      {showPaymentForm && (
        <div className="payment-form-modal">
          <div className="payment-form-container">
            <div className="payment-form-header">
              <h2>Nouveau Paiement</h2>
              <button 
                className="close-button" 
                onClick={() => setShowPaymentForm(false)}
                aria-label="Fermer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmitPayment}>
              <div className="form-group">
                <label htmlFor="vendorName">Nom du vendeur</label>
                <input
                  id="vendorName"
                  type="text"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleFormChange}
                  required
                  placeholder="Nom complet du vendeur"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="vendorEmail">Email du vendeur</label>
                <input
                  id="vendorEmail"
                  type="email"
                  name="vendorEmail"
                  value={formData.vendorEmail}
                  onChange={handleFormChange}
                  required
                  placeholder="email@exemple.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="amount">Montant (€)</label>
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  required
                  placeholder="0,00"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="method">Méthode de paiement</label>
                <select
                  id="method"
                  name="method"
                  value={formData.method}
                  onChange={handleFormChange}
                  required
                >
                  <option value="Virement bancaire">Virement bancaire</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Chèque">Chèque</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="reference">Référence</label>
                <input
                  id="reference"
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleFormChange}
                  required
                  readOnly
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bankAccount">Compte bancaire (si virement)</label>
                <input
                  id="bankAccount"
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleFormChange}
                  required={formData.method === 'Virement bancaire'}
                  disabled={formData.method !== 'Virement bancaire'}
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description (optionnel)</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Motif du paiement..."
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="button button-secondary"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="button button-primary"
                >
                  Confirmer le paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
          <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input 
          type="text" 
          placeholder="Rechercher par vendeur, email ou référence..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Rechercher des paiements"
        />
      </div>
      
      <div className="filters-container">
        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option>Tous les statuts</option>
          <option>Payé</option>
          <option>En attente</option>
          <option>Échoué</option>
          <option>Remboursé</option>
        </select>
        
        <select 
          className="filter-select"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          aria-label="Filtrer par méthode"
        >
          <option>Toutes les méthodes</option>
          <option>Virement bancaire</option>
          <option>PayPal</option>
          <option>Espèces</option>
          <option>Chèque</option>
        </select>
      </div>
      
      <div className="payments-summary">
        <div className="summary-card">
          <div className="summary-label">Total payé</div>
          <div className="summary-value">
            {formatCurrency(payments
              .filter(p => p.status === 'Success')
              .reduce((sum, p) => sum + p.amount, 0)
            )}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">En attente</div>
          <div className="summary-value">
            {formatCurrency(payments
              .filter(p => p.status === 'Initiated')
              .reduce((sum, p) => sum + p.amount, 0)
            )}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Nombre de vendeurs</div>
          <div className="summary-value">
            {[...new Set(payments.map(p => p.vendor?.email))].length}
          </div>
        </div>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Vendeur</th>
              <th>Compte bancaire</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Méthode</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.reference || 'N/A'}</td>
                  <td>
                    <div className="vendor-info">
                      <div className="vendor-name">{payment.vendor?.name || 'N/A'}</div>
                      <div className="vendor-email">{payment.vendor?.email || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="bank-account">
                    {payment.method === 'Virement bancaire' 
                      ? payment.vendor?.bankAccount || 'N/A' 
                      : '-'}
                  </td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(payment.status)}`}>
                      {formatStatus(payment.status)}
                    </span>
                  </td>
                  <td>{formatDate(payment.transactionDate)}</td>
                  <td>{payment.method || 'N/A'}</td>
                  <td>
                    <button className="action-button" title="Options">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-results">
                  Aucun paiement trouvé avec les critères sélectionnés
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VendorPayments;