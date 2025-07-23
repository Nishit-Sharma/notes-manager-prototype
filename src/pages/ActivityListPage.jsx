import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, where, Timestamp } from 'firebase/firestore';
import { getToday, getEndOfDay } from '../utils/dateUtils';
import { statusOptions, methodOptions } from '../constants/activityConstants';
import ActivityFilter from '../components/ActivityFilter';
import ActivityTable from '../components/ActivityTable';
import useActivities from '../hooks/useActivities';
import Modal from '../components/Modal';

const ActivityListPage = () => {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState(null);
  const [dateToFilter, setDateToFilter] = useState(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState(null);
  const [assignedToFilter, setAssignedToFilter] = useState(null);
  
  const [sortField, setSortField] = useState('activityTimestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  const { activities, isLoading, error } = useActivities(
    { keyword, selectedClientFilter, statusFilter, methodFilter, dateFromFilter, dateToFilter, assignedToFilter },
    { sortField, sortDirection }
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activityToDeleteId, setActivityToDeleteId] = useState(null);

  const setDateRangePreset = useCallback((preset) => {
    const today = getToday();
    let startDate, endDate = getEndOfDay(new Date());
    switch (preset) {
      case 'Today':
        startDate = today;
        endDate = getEndOfDay(today);
        break;
      case 'Yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = yesterday;
        endDate = getEndOfDay(yesterday);
        break;
      case 'ThisWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
        startDate.setHours(0,0,0,0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate = getEndOfDay(endDate);
        break;
      case 'LastWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) - 7);
        startDate.setHours(0,0,0,0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate = getEndOfDay(endDate);
        break;
      case 'ThisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = getEndOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        break;
      case 'LastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = getEndOfDay(new Date(today.getFullYear(), today.getMonth(), 0));
        break;
      default: return;
    }
    setDateFromFilter(startDate);
    setDateToFilter(endDate);
  }, []);

  useEffect(() => {
    const qClients = query(collection(db, "clients"), orderBy("clientName"));
    const unsubClients = onSnapshot(qClients, (querySnapshot) => {
      setClients(querySnapshot.docs.map(doc => ({ value: doc.id, label: doc.data().clientName })));
    });

    const qUsers = query(collection(db, "users"), orderBy("userName"));
    const unsubUsers = onSnapshot(qUsers, (querySnapshot) => {
      setUsers(querySnapshot.docs.map(doc => ({ value: doc.id, label: doc.data().userName })));
    });

    return () => {
      unsubClients();
      unsubUsers();
    };
    }, []);

  const handleDeleteRequest = (activityId) => {
    setActivityToDeleteId(activityId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteActivity = useCallback(async () => {
    if (!activityToDeleteId) return;
    try {
      await deleteDoc(doc(db, "activityLogs", activityToDeleteId));
    } catch (err) {
      console.error("Error deleting activity: ", err);
      alert("Failed to delete activity. " + err.message);
    }
    // No need to call onClose from here, Modal itself handles it on confirm.
    // setIsDeleteModalOpen(false); // Modal closes itself
    // setActivityToDeleteId(null); // Reset if needed, or do it in modal close
  }, [activityToDeleteId]);

  const handleResetFilters = useCallback(() => {
    setKeyword('');
    setSelectedClientFilter(null);
    setStatusFilter('');
    setMethodFilter('');
    setDateFromFilter(null);
    setDateToFilter(null);
    setAssignedToFilter(null);
    setSortField('activityTimestamp');
    setSortDirection('desc');
  }, []);

  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate ? timestamp.toDate().toLocaleString() : new Date(timestamp).toLocaleString();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-gray-700">Activity Log</h2>
      
      <ActivityFilter 
        keyword={keyword} setKeyword={setKeyword}
        clients={clients} selectedClientFilter={selectedClientFilter} setSelectedClientFilter={setSelectedClientFilter}
        users={users} assignedToFilter={assignedToFilter} setAssignedToFilter={setAssignedToFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter} statusOptions={statusOptions}
        methodFilter={methodFilter} setMethodFilter={setMethodFilter} methodOptions={methodOptions}
        dateFromFilter={dateFromFilter} setDateFromFilter={setDateFromFilter}
        dateToFilter={dateToFilter} setDateToFilter={setDateToFilter}
        setDateRangePreset={setDateRangePreset}
        sortField={sortField} setSortField={setSortField}
        sortDirection={sortDirection} setSortDirection={setSortDirection}
        handleResetFilters={handleResetFilters}
      />

      {isLoading && <div className="p-10 text-center">Loading activities...</div>}
      {!isLoading && error && <div className="p-10 text-center text-red-500">{error}</div>}
      {!isLoading && !error && activities.length === 0 && (
        <div className="p-10 text-center">No activities match your current filters.</div>
      )}
      {!isLoading && !error && activities.length > 0 && (
        <ActivityTable 
          activities={activities}
          formatDate={formatDate}
          handleDeleteActivity={handleDeleteRequest}
          navigate={navigate}
        />
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActivityToDeleteId(null);
        }}
        title="Confirm Deletion"
        onConfirm={confirmDeleteActivity}
        confirmText="Delete"
        cancelText="Cancel"
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to delete this activity log? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default ActivityListPage; 