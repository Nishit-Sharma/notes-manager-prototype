import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, where, Timestamp, onSnapshot } from 'firebase/firestore';

const useActivities = (filters, sort) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { 
    keyword,
    selectedClientFilter,
    statusFilter,
    methodFilter,
    dateFromFilter,
    dateToFilter,
    assignedToFilter 
  } = filters;

  const { sortField, sortDirection } = sort;

  const buildQuery = useCallback(() => {
    let q = collection(db, "activityLogs");
    const queryFilters = [];

    if (selectedClientFilter) {
      queryFilters.push(where("clientId", "==", selectedClientFilter.value));
    }
    if (statusFilter) {
      queryFilters.push(where("status", "==", statusFilter));
    }
    if (methodFilter) {
      queryFilters.push(where("contactMethod", "==", methodFilter));
    }
    if (assignedToFilter) {
      queryFilters.push(where("assignedToUserId", "==", assignedToFilter.value));
    }
    if (dateFromFilter) {
      queryFilters.push(where("activityTimestamp", ">=", Timestamp.fromDate(new Date(dateFromFilter))));
    }
    if (dateToFilter) {
      const endOfDayDate = new Date(dateToFilter);
      endOfDayDate.setHours(23, 59, 59, 999);
      queryFilters.push(where("activityTimestamp", "<=", Timestamp.fromDate(endOfDayDate)));
    }

    const orderByClauses = [];
    if (dateFromFilter || dateToFilter) {
      orderByClauses.push(orderBy('activityTimestamp', sortField === 'activityTimestamp' ? sortDirection : 'desc'));
      if (sortField !== 'activityTimestamp') {
        orderByClauses.push(orderBy(sortField, sortDirection));
      }
    } else {
      orderByClauses.push(orderBy(sortField, sortDirection));
      if (sortField !== 'activityTimestamp') {
        orderByClauses.push(orderBy('activityTimestamp', 'desc'));
      }
    }
    
    if (queryFilters.length > 0 && orderByClauses.length > 0) {
        q = query(collection(db, "activityLogs"), ...queryFilters, ...orderByClauses);
    } else if (queryFilters.length > 0) {
        q = query(collection(db, "activityLogs"), ...queryFilters, orderBy('activityTimestamp', 'desc'));
    } else if (orderByClauses.length > 0) {
        q = query(collection(db, "activityLogs"), ...orderByClauses);
    } else {
        q = query(collection(db, "activityLogs"), orderBy('activityTimestamp', 'desc'));
    }
    return q;
  }, [
    selectedClientFilter, statusFilter, methodFilter, 
    dateFromFilter, dateToFilter, assignedToFilter, 
    sortField, sortDirection
  ]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const q = buildQuery();

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let activitiesData = [];
      querySnapshot.forEach((doc) => {
        activitiesData.push({ id: doc.id, ...doc.data() });
      });
      
      if (keyword && keyword.trim() !== '') {
        const lowerKeyword = keyword.toLowerCase();
        activitiesData = activitiesData.filter(act => 
            (act.clientName && act.clientName.toLowerCase().includes(lowerKeyword)) || 
            (act.subject && act.subject.toLowerCase().includes(lowerKeyword)) ||
            (act.details && act.details.toLowerCase().includes(lowerKeyword))
        );
      }

      setActivities(activitiesData);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching activities: ", err);
      setError("Failed to load activities. Please ensure Firestore indexes are set up, or simplify your query.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [buildQuery, keyword]);

  return { activities, isLoading, error };
};

export default useActivities; 