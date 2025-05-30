import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null); // Client data for editing

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "clients"), orderBy("clientName", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData = [];
      querySnapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() });
      });
      setClients(clientsData);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching clients: ", err);
      setError("Failed to load clients. Please try again later.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (client = null) => {
    setEditingClient(client); // If client is null, it's for adding new
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = (savedClient) => {
    // Optionally, provide feedback to the user that save was successful
    // The list will update automatically due to onSnapshot
    handleCloseModal();
  };
  
  const handleDeleteClient = async (clientId) => {
    if (window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "clients", clientId));
        // Add feedback if necessary, list updates via onSnapshot
      } catch (err) {
        console.error("Error deleting client: ", err);
        alert("Failed to delete client.");
      }
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading clients...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Manage Clients</h2>
        <button
          onClick={() => handleOpenModal()} // Open modal for new client
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.primaryContactName || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.primaryContactEmail || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.primaryContactPhone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleOpenModal(client)} className="text-blue-600 hover:text-blue-900">Edit</button>
                    <button onClick={() => handleDeleteClient(client.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingClient ? "Edit Client" : "Add New Client"}>
        <ClientForm 
            existingClient={editingClient} 
            onSave={handleSaveClient} 
            onCancel={handleCloseModal} 
        />
      </Modal>
    </div>
  );
};

export default ClientsPage; 