import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, doc, setDoc, serverTimestamp, Timestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import Modal from './Modal';
import ClientForm from './ClientForm';

const LogActivityForm = ({ existingActivity, onSave, onCancel }) => {
  const { userData } = useAuth();

  const [activityTimestamp, setActivityTimestamp] = useState(new Date());
  const [selectedClient, setSelectedClient] = useState(null);
  const [contactPerson, setContactPerson] = useState('');
  const [contactMethod, setContactMethod] = useState('Phone');
  const [direction, setDirection] = useState('Incoming');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [status, setStatus] = useState('Open');
  const [priority, setPriority] = useState('Medium');
  const [followUpDate, setFollowUpDate] = useState(null);
  const [assignedToUser, setAssignedToUser] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const resetFormFields = useCallback((defaultUser = null) => {
    setActivityTimestamp(new Date());
    setSelectedClient(null);
    setContactPerson('');
    setContactMethod('Phone');
    setDirection('Incoming');
    setSubject('');
    setDetails('');
    setActionTaken('');
    setStatus('Open');
    setPriority('Medium');
    setFollowUpDate(null);
    setAssignedToUser(defaultUser);
  }, []);

  useEffect(() => {
    const qUsers = query(collection(db, "users"), orderBy("userName"));
    const unsubUsers = onSnapshot(qUsers, (querySnapshot) => {
      const usersData = querySnapshot.docs.map(doc => ({ value: doc.id, label: doc.data().userName, ...doc.data() }));
      setUsers(usersData);
      
      const currentUserOption = userData && usersData.length > 0 ? usersData.find(u => u.value === userData.uid) : null;

      if (existingActivity) {
        const assignedUserOption = existingActivity.assignedToUserId && usersData.length > 0 ? 
                                   usersData.find(u => u.value === existingActivity.assignedToUserId) : null;
        setAssignedToUser(assignedUserOption);
      } else {
        resetFormFields(currentUserOption); 
      }
    }, (error) => {
      console.error("Error fetching users for dropdown: ", error);
    });
    return () => unsubUsers();
  }, [existingActivity, userData, resetFormFields]);

  useEffect(() => {
    if (existingActivity) {
      setActivityTimestamp(existingActivity.activityTimestamp?.toDate() || new Date());
      setContactPerson(existingActivity.contactPerson || '');
      setContactMethod(existingActivity.contactMethod || 'Phone');
      setDirection(existingActivity.direction || 'Incoming');
      setSubject(existingActivity.subject || '');
      setDetails(existingActivity.details || '');
      setActionTaken(existingActivity.actionTaken || '');
      setStatus(existingActivity.status || 'Open');
      setPriority(existingActivity.priority || 'Medium');
      setFollowUpDate(existingActivity.followUpDate?.toDate() || null);
    } else {
      const currentUserOption = userData && users.length > 0 ? users.find(u => u.value === userData.uid) : null;
      resetFormFields(currentUserOption);
    }
  }, [existingActivity, userData, users, resetFormFields]);

  useEffect(() => {
    const qClients = query(collection(db, "clients"), orderBy("clientName"));
    const unsubscribeClients = onSnapshot(qClients, (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => ({ value: doc.id, label: doc.data().clientName, ...doc.data() }));
      setClients(clientsData);
      if (existingActivity && existingActivity.clientId) {
        const clientOption = clientsData.find(c => c.value === existingActivity.clientId);
        setSelectedClient(clientOption || null);
      } else if (!existingActivity) {
      }
    }, (error) => {
      console.error("Error fetching clients for dropdown: ", error);
    });
    return () => unsubscribeClients();
  }, [existingActivity]);

  const handleClientChange = (selectedOption) => setSelectedClient(selectedOption);
  const handleAssignedToChange = (selectedOption) => setAssignedToUser(selectedOption);
  const handleOpenClientModal = () => setIsClientModalOpen(true);
  const handleCloseClientModal = () => setIsClientModalOpen(false);

  const handleClientSaved = useCallback((savedClient) => {
    const newClientOption = { value: savedClient.id, label: savedClient.clientName, ...savedClient };    
    setClients(prevClients => {
        const filtered = prevClients.filter(c => c.value !== savedClient.id);
        const updatedClients = [...filtered, newClientOption];
        updatedClients.sort((a,b) => a.label.localeCompare(b.label));
        return updatedClients;
    });
    setSelectedClient(newClientOption);
    handleCloseClientModal();
    setMessage('New client added and selected.');
    setTimeout(() => setMessage(''), 3000);
  }, [handleCloseClientModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!selectedClient || !subject) {
      setMessage('Client Name and Subject are required.');
      setIsLoading(false);
      return;
    }

    const activityData = {
      activityTimestamp: Timestamp.fromDate(activityTimestamp),
      clientId: selectedClient.value, clientName: selectedClient.label,
      contactPerson, contactMethod, direction, subject, details, actionTaken, status, priority,
      followUpDate: followUpDate ? Timestamp.fromDate(followUpDate) : null,
      assignedToUserId: assignedToUser ? assignedToUser.value : null,
      assignedToName: assignedToUser ? assignedToUser.label : null,
      lastModifiedAt: serverTimestamp(),
    };

    if (existingActivity && existingActivity.id) {
      activityData.modifiedByUserId = userData?.uid || null;
      activityData.modifiedByUserName = userData?.userName || auth.currentUser?.email || null;
      activityData.createdAt = existingActivity.createdAt || serverTimestamp();
    } else {
      activityData.createdByUserId = userData?.uid || null;
      activityData.createdByUserName = userData?.userName || auth.currentUser?.email || null;
      activityData.createdAt = serverTimestamp();
    }

    try {
      if (existingActivity && existingActivity.id) {
        const activityRef = doc(db, 'activityLogs', existingActivity.id);
        await setDoc(activityRef, activityData, { merge: true });
        setMessage('Activity updated successfully!');
      } else {
        await addDoc(collection(db, 'activityLogs'), activityData);
        setMessage('Activity logged successfully!');
        if (!onSave) {
            const currentUserOption = userData && users.length > 0 ? users.find(u => u.value === userData.uid) : null;
            resetFormFields(currentUserOption);
        }
      }
      if (onSave) onSave(activityData);
    } catch (error) {
      console.error("Error saving activity: ", error);
      setMessage(`Failed to save activity: ${error.message}`);
    }
    setIsLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white shadow-lg rounded-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">
            {existingActivity ? 'Edit Office Activity' : 'Log New Office Activity'}
        </h2>

        {message && (
          <p className={`p-3 rounded-md text-sm ${message.startsWith('Failed') || message.includes('required') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="activityTimestamp" className="block text-sm font-medium text-gray-700 mb-1">Activity Date & Time</label>
            <DatePicker
              id="activityTimestamp"
              selected={activityTimestamp}
              onChange={(date) => setActivityTimestamp(date)}
              showTimeSelect
              dateFormat="Pp"
              className="form-input"
              required
            />
          </div>

          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <div className="flex items-center space-x-2">
                <Select
                    id="clientName"
                    options={clients}
                    value={selectedClient}
                    onChange={handleClientChange}
                    placeholder="Select or type to search..."
                    isClearable
                    className="react-select-container flex-grow"
                    classNamePrefix="react-select"
                    required
                />
                <button 
                    type="button"
                    onClick={handleOpenClientModal}
                    className="btn-secondary py-2 whitespace-nowrap"
                >
                    + New
                </button>
            </div>
          </div>

          <div>
            <label htmlFor="assignedToUser" className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <Select 
                id="assignedToUser" 
                options={users} 
                value={assignedToUser} 
                onChange={handleAssignedToChange} 
                placeholder="Select staff member..." 
                isClearable 
                className="react-select-container"
                classNamePrefix="react-select"
            />
          </div>

          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">Contact Person (Client)</label>
            <input
              type="text"
              id="contactPerson"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="contactMethod" className="block text-sm font-medium text-gray-700 mb-1">Contact Method</label>
            <select
              id="contactMethod"
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              className="form-select"
            >
              <option>Phone</option>
              <option>Email</option>
              <option>In-Person Meeting</option>
              <option>Virtual Meeting</option>
              <option>Document Submission</option>
              <option>Internal Task</option>
            </select>
          </div>

          <div>
            <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
            <select
              id="direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="form-select"
            >
              <option>Incoming</option>
              <option>Outgoing</option>
              <option>N/A</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-select"
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Needs Follow-up</option>
              <option>Waiting for Client</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="form-select"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date/Time (Optional)</label>
            <DatePicker
              id="followUpDate"
              selected={followUpDate}
              onChange={(date) => setFollowUpDate(date)}
              showTimeSelect
              dateFormat="Pp"
              className="form-input"
              isClearable
              placeholderText="Select date and time"
            />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Purpose/Subject</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">Detailed Notes/Description</label>
          <textarea
            id="details"
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="form-textarea"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label htmlFor="actionTaken" className="block text-sm font-medium text-gray-700 mb-1">Action Taken (if any)</label>
          <textarea
            id="actionTaken"
            rows={3}
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            className="form-textarea"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
            {onCancel && (
                 <button
                    type="button"
                    onClick={onCancel} 
                    className="btn-secondary"
                    >
                    Cancel
                </button>
            )}
            <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
            >
                {isLoading ? (existingActivity ? 'Saving...' : 'Logging...') : (existingActivity ? 'Save Changes' : 'Log Activity')}
            </button>
        </div>
      </form>

      <Modal isOpen={isClientModalOpen} onClose={handleCloseClientModal} title="Add New Client">
        <ClientForm 
            onSave={handleClientSaved} 
            onCancel={handleCloseClientModal} 
        />
      </Modal>
    </>
  );
};

export default LogActivityForm; 