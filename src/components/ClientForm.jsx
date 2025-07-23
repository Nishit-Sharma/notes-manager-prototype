import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const ClientForm = ({ existingClient, onSave, onCancel }) => {
  const [clientName, setClientName] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [primaryContactPhone, setPrimaryContactPhone] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (existingClient) {
      setClientName(existingClient.clientName || '');
      setPrimaryContactName(existingClient.primaryContactName || '');
      setPrimaryContactEmail(existingClient.primaryContactEmail || '');
      setPrimaryContactPhone(existingClient.primaryContactPhone || '');
      setGeneralNotes(existingClient.generalNotes || '');
    } else {
      setClientName('');
      setPrimaryContactName('');
      setPrimaryContactEmail('');
      setPrimaryContactPhone('');
      setGeneralNotes('');
    }
  }, [existingClient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!clientName) {
      setMessage('Client Name is required.');
      setIsLoading(false);
      return;
    }

    const clientData = {
      clientName,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      generalNotes,
      lastModifiedAt: serverTimestamp(),
    };

    try {
      let savedClient;
      if (existingClient && existingClient.id) {
        // Update existing client
        const clientRef = doc(db, 'clients', existingClient.id);
        await setDoc(clientRef, { ...clientData, createdAt: existingClient.createdAt || serverTimestamp() }, { merge: true });
        setMessage('Client updated successfully!');
        savedClient = { id: existingClient.id, ...clientData }; 
      } else {
        // Add new client
        const docRef = await addDoc(collection(db, 'clients'), {
          ...clientData,
          createdAt: serverTimestamp(),
        });
        setMessage('Client added successfully!');
        savedClient = { id: docRef.id, ...clientData }; 
      }
      if (onSave) {
        onSave(savedClient); // Pass the saved client data (including ID) back
      }
    } catch (error) {
      console.error("Error saving client: ", error);
      setMessage(`Failed to save client: ${error.message}`);
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {message && (
        <p className={`p-2 rounded-md text-sm ${message.startsWith('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </p>
      )}

      <div>
        <label htmlFor="clientNameModal" className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="clientNameModal"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="form-input"
          required
        />
      </div>

      <div>
        <label htmlFor="primaryContactNameModal" className="block text-sm font-medium text-gray-700">Primary Contact Name</label>
        <input
          type="text"
          id="primaryContactNameModal"
          value={primaryContactName}
          onChange={(e) => setPrimaryContactName(e.target.value)}
          className="form-input"
        />
      </div>

      <div>
        <label htmlFor="primaryContactEmailModal" className="block text-sm font-medium text-gray-700">Primary Contact Email</label>
        <input
          type="email"
          id="primaryContactEmailModal"
          value={primaryContactEmail}
          onChange={(e) => setPrimaryContactEmail(e.target.value)}
          className="form-input"
        />
      </div>

      <div>
        <label htmlFor="primaryContactPhoneModal" className="block text-sm font-medium text-gray-700">Primary Contact Phone</label>
        <input
          type="tel"
          id="primaryContactPhoneModal"
          value={primaryContactPhone}
          onChange={(e) => setPrimaryContactPhone(e.target.value)}
          className="form-input"
        />
      </div>

      <div>
        <label htmlFor="generalNotesModal" className="block text-sm font-medium text-gray-700">General Notes</label>
        <textarea
          id="generalNotesModal"
          rows={3}
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          className="form-textarea"
        />
      </div>

      <div className="flex justify-end pt-3 space-x-3">
         <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded hover:bg-gray-300"
            >
            Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {isLoading ? (existingClient ? 'Saving...' : 'Adding...') : (existingClient ? 'Save Changes' : 'Add Client')}
        </button>
      </div>
    </form>
  );
};

export default ClientForm; 