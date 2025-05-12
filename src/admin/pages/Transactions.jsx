import React, { useState, useEffect } from 'react';
import './Transactions.css';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tous les types');
  const [statusFilter, setStatusFilter] = useState('Tous les statuts');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/payments');
        setTransactions(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.vendor?.name && transaction.vendor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = 
      typeFilter === 'Tous les types' || 
      (typeFilter === 'Vente' && transaction.amount > 0) ||
      (typeFilter === 'Paiement vendeur' && transaction.method === 'Vendor Payment') ||
      (typeFilter === 'Remboursement' && transaction.method === 'Refund');

    const matchesStatus = 
      statusFilter === 'Tous les statuts' ||
      (statusFilter === 'Réussie' && transaction.status === 'Completed') ||
      (statusFilter === 'En attente' && transaction.status === 'Pending') ||
      (statusFilter === 'Échouée' && transaction.status === 'Failed');

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleExportExcel = () => {
    const exportData = filteredTransactions.map(transaction => ({
      'ID': transaction.reference,
      'Type': transaction.amount > 0 ? 'Vente' : 
              transaction.method === 'Refund' ? 'Remboursement' : 'Paiement vendeur',
      'Description': transaction.description,
      'Montant (€)': transaction.amount,
      'Statut': transaction.status === 'Completed' ? 'Réussie' : 
                transaction.status === 'Pending' ? 'En attente' : 'Échouée',
      'Date': new Date(transaction.transactionDate).toLocaleString(),
      'Client/Vendeur': transaction.vendor?.name || 'N/A'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `transactions_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(16);
    doc.text('Rapport des Transactions', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    
    // Tableau
    const tableData = filteredTransactions.map(transaction => [
      transaction.reference,
      transaction.amount > 0 ? 'Vente' : 
        transaction.method === 'Refund' ? 'Remboursement' : 'Paiement vendeur',
      transaction.description || 'N/A',
      `${transaction.amount >= 0 ? '+' : '-'}€${Math.abs(transaction.amount).toFixed(2)}`,
      transaction.status === 'Completed' ? 'Réussie' : 
        transaction.status === 'Pending' ? 'En attente' : 'Échouée',
      new Date(transaction.transactionDate).toLocaleDateString(),
      transaction.vendor?.name || 'N/A'
    ]);

    doc.autoTable({
      head: [['ID', 'Type', 'Description', 'Montant', 'Statut', 'Date', 'Client/Vendeur']],
      body: tableData,
      startY: 30,
      margin: { horizontal: 10 },
      styles: {
        cellPadding: 3,
        fontSize: 8,
        valign: 'middle',
        halign: 'left'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'wrap' },
        3: { cellWidth: 'auto', halign: 'right' },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 'auto' }
      }
    });

    doc.save(`transactions_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleExportReceipt = (transactionId) => {
    const transaction = transactions.find(t => t._id === transactionId);
    if (!transaction) return;

    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text('REÇU DE TRANSACTION', 105, 20, { align: 'center' });
    
    // Détails
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    const details = [
      { label: 'Référence', value: transaction.reference },
      { label: 'Date', value: new Date(transaction.transactionDate).toLocaleString() },
      { label: 'Type', value: transaction.amount > 0 ? 'Vente' : 'Remboursement' },
      { label: 'Statut', value: transaction.status === 'Completed' ? 'Complété' : 'En attente' },
      { label: 'Montant', value: `${transaction.amount >= 0 ? '+' : '-'}€${Math.abs(transaction.amount).toFixed(2)}` },
      { label: 'Client/Vendeur', value: transaction.vendor?.name || 'N/A' },
      { label: 'Description', value: transaction.description || 'N/A' }
    ];
    
    let yPosition = 40;
    details.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label}:`, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 60, yPosition);
      yPosition += 8;
    });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Merci pour votre confiance', 105, 140, { align: 'center' });
    
    doc.save(`recu_${transaction.reference}.pdf`);
  };

  if (loading) return <div className="loading">Chargement des transactions...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1 className="page-title">Gestion des Transactions</h1>
        <div className="export-buttons">
          <button className="button button-primary" onClick={handleExportExcel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="button-icon">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Excel
          </button>
          <button className="button button-secondary" onClick={handleExportPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="button-icon">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            PDF
          </button>
        </div>
      </div>
      
      <div className="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
          <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input 
          type="text" 
          placeholder="Rechercher des transactions..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="filters-container">
        <select 
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option>Tous les types</option>
          <option>Vente</option>
          <option>Paiement vendeur</option>
          <option>Remboursement</option>
        </select>
        
        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>Tous les statuts</option>
          <option>Réussie</option>
          <option>En attente</option>
          <option>Échouée</option>
        </select>
      </div>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Description</th>
            <th>Montant</th>
            <th>Statut</th>
            <th>Date</th>
            <th>Client/Vendeur</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <tr key={transaction._id}>
                <td>{transaction.reference || 'N/A'}</td>
                <td>
                  {transaction.amount > 0 ? 'Vente' : 
                   transaction.method === 'Refund' ? 'Remboursement' : 'Paiement vendeur'}
                </td>
                <td>{transaction.description || 'N/A'}</td>
                <td className={`amount-${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                  {transaction.amount >= 0 ? '+' : '-'}€{Math.abs(transaction.amount).toFixed(2)}
                </td>
                <td>
                  <span className={`status-badge status-${
                    transaction.status === 'Completed' ? 'success' : 
                    transaction.status === 'Pending' ? 'pending' : 'failed'
                  }`}>
                    {transaction.status === 'Completed' ? 'Réussie' : 
                     transaction.status === 'Pending' ? 'En attente' : 'Échouée'}
                  </span>
                </td>
                <td>{new Date(transaction.transactionDate).toLocaleString()}</td>
                <td>{transaction.vendor?.name || 'N/A'}</td>
                <td>
                  <button 
                    className="action-button"
                    onClick={() => handleExportReceipt(transaction._id)}
                    title="Exporter le reçu"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15V3M12 15L7 10M12 15L17 10M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{textAlign: 'center'}}>
                Aucune transaction trouvée
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Transactions;