import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isClientFormModalOpen, setIsClientFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [clientToDeleteId, setClientToDeleteId] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "clients"), orderBy("clientName", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching clients: ", err);
      setError("Failed to load clients. Please try again later.");
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenClientFormModal = (client = null) => {
    setEditingClient(client);
    setIsClientFormModalOpen(true);
  };

  const handleCloseClientFormModal = () => {
    setIsClientFormModalOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = () => {
    handleCloseClientFormModal();
  };
  
  const handleDeleteClientRequest = (clientId) => {
    setClientToDeleteId(clientId);
    setIsDeleteConfirmModalOpen(true);
  };

  const confirmDeleteClient = useCallback(async () => {
    if (!clientToDeleteId) return;
    try {
      await deleteDoc(doc(db, "clients", clientToDeleteId));
    } catch (err) {
      console.error("Error deleting client: ", err);
      alert("Failed to delete client: " + err.message);
    }
    // Modal closes itself via its onConfirm handler logic
    // setIsDeleteConfirmModalOpen(false); 
    // setClientToDeleteId(null);
  }, [clientToDeleteId]);

  if (isLoading) return <div className="p-10 text-center">Loading clients...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Manage Clients</h2>
        <button
          onClick={() => handleOpenClientFormModal()} 
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          + Add New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <p className="text-gray-600">No clients found. Click "Add New Client" to get started.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">Client Name</th>
                <th className="table-th">Contact Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="table-td">{client.clientName}</td>
                  <td className="table-td">{client.primaryContactName || '-'}</td>
                  <td className="table-td">{client.primaryContactEmail || '-'}</td>
                  <td className="table-td">{client.primaryContactPhone || '-'}</td>
                  <td className="space-x-2 table-td">
                    <button onClick={() => handleOpenClientFormModal(client)} className="text-blue-600 hover:text-blue-900">Edit</button>
                    <button onClick={() => handleDeleteClientRequest(client.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal 
        isOpen={isClientFormModalOpen} 
        onClose={handleCloseClientFormModal} 
        title={editingClient ? "Edit Client" : "Add New Client"}
      >
        <ClientForm 
            existingClient={editingClient} 
            onSave={handleSaveClient} 
            onCancel={handleCloseClientFormModal} 
        />
      </Modal>

      <Modal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => {
          setIsDeleteConfirmModalOpen(false);
          setClientToDeleteId(null);
        }}
        title="Confirm Deletion"
        onConfirm={confirmDeleteClient}
        confirmText="Delete"
        cancelText="Cancel"
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to delete this client? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default ClientsPage; 