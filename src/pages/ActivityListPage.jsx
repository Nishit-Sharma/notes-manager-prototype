import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, where, Timestamp } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';

// Helper for date calculations
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getEndOfDay = (date) => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

const ActivityListPage = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' means all
  const [methodFilter, setMethodFilter] = useState(''); // '' means all
  const [dateFromFilter, setDateFromFilter] = useState(null);
  const [dateToFilter, setDateToFilter] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState(null);
  const [users, setUsers] = useState([]); // For Assigned To filter
  const [assignedToFilter, setAssignedToFilter] = useState(null); // For Assigned To filter

  // Sorting states
  const [sortField, setSortField] = useState('activityTimestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  const setDateRangePreset = (preset) => {
    const today = getToday();
    let startDate, endDate = getEndOfDay(new Date()); // Default endDate to today for most presets

    switch (preset) {
      case 'Today':
        startDate = today;
        endDate = getEndOfDay(today);
        break;
      case 'Yesterday':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        endDate = getEndOfDay(startDate);
        break;
      case 'ThisWeek': // Assuming week starts on Monday
        startDate = new Date(today);
        startDate.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Adjust to Monday
        startDate.setHours(0,0,0,0);
        // endDate will be Sunday of this week
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate = getEndOfDay(endDate);
        break;
      case 'LastWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) - 7); // Monday of last week
        startDate.setHours(0,0,0,0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Sunday of last week
        endDate = getEndOfDay(endDate);
        break;
      case 'ThisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = getEndOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0)); // Last day of current month
        break;
      case 'LastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = getEndOfDay(new Date(today.getFullYear(), today.getMonth(), 0)); // Last day of previous month
        break;
      default:
        return;
    }
    setDateFromFilter(startDate);
    setDateToFilter(endDate);
  };

  // Fetch clients and users for filter dropdown
  useEffect(() => {
    const qClients = query(collection(db, "clients"), orderBy("clientName"));
    const unsubClients = onSnapshot(qClients, (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => ({ value: doc.id, label: doc.data().clientName }));
      setClients(clientsData);
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

  const buildQuery = useCallback(() => {
    let q = collection(db, "activityLogs"); // Base collection reference

    // Apply filters first
    const filters = [];
    if (selectedClientFilter) {
      filters.push(where("clientId", "==", selectedClientFilter.value));
    }
    if (statusFilter) {
      filters.push(where("status", "==", statusFilter));
    }
    if (methodFilter) {
      filters.push(where("contactMethod", "==", methodFilter));
    }
    if (assignedToFilter) {
      filters.push(where("assignedToUserId", "==", assignedToFilter.value));
    }
    // Date filters - these use inequality, so Firestore needs an orderBy on this field first if present
    if (dateFromFilter) {
      filters.push(where("activityTimestamp", ">=", Timestamp.fromDate(dateFromFilter)));
    }
    if (dateToFilter) {
      const endOfDay = new Date(dateToFilter);
      endOfDay.setHours(23, 59, 59, 999);
      filters.push(where("activityTimestamp", "<=", Timestamp.fromDate(endOfDay)));
    }

    // Apply orderBy
    // If there's an inequality filter (dateFromFilter or dateToFilter), 
    // Firestore requires the first orderBy to be on that same field.
    const orderByClauses = [];
    if (dateFromFilter || dateToFilter) {
      orderByClauses.push(orderBy('activityTimestamp', sortField === 'activityTimestamp' ? sortDirection : 'desc'));
      // If sorting by a different field, add it as a secondary sort if it is not activityTimestamp
      if (sortField !== 'activityTimestamp') {
        orderByClauses.push(orderBy(sortField, sortDirection));
      }
    } else {
      // If no date range filter, we can sort by the selected field directly
      orderByClauses.push(orderBy(sortField, sortDirection));
      // Add a secondary sort by activityTimestamp if primary sort is not activityTimestamp, for consistent ordering
      if (sortField !== 'activityTimestamp') {
        orderByClauses.push(orderBy('activityTimestamp', 'desc'));
      }
    }
    
    // Construct the final query
    if (filters.length > 0 && orderByClauses.length > 0) {
        q = query(collection(db, "activityLogs"), ...filters, ...orderByClauses);
    } else if (filters.length > 0) {
        q = query(collection(db, "activityLogs"), ...filters, orderBy('activityTimestamp', 'desc')); // Default sort if only filters
    } else if (orderByClauses.length > 0) {
        q = query(collection(db, "activityLogs"), ...orderByClauses);
    } else {
        q = query(collection(db, "activityLogs"), orderBy('activityTimestamp', 'desc')); // Default query
    }

    return q;
  }, [selectedClientFilter, statusFilter, methodFilter, dateFromFilter, dateToFilter, assignedToFilter, sortField, sortDirection]);

  useEffect(() => {
    setIsLoading(true);
    const q = buildQuery();

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let activitiesData = [];
      querySnapshot.forEach((doc) => {
        activitiesData.push({ id: doc.id, ...doc.data() });
      });
      
      // Client-side keyword filtering (basic)
      if (keyword.trim() !== '') {
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
      setError("Failed to load activities. Please ensure Firestore indexes are set up for your query combinations.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [buildQuery, keyword]); // Re-run if buildQuery changes (filters change) or keyword changes

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm("Are you sure you want to delete this activity log? This action cannot be undone.")) {
        try {
            await deleteDoc(doc(db, "activityLogs", activityId));
        } catch (err) {
            console.error("Error deleting activity: ", err);
            alert("Failed to delete activity.");
        }
    }
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSelectedClientFilter(null);
    setStatusFilter('');
    setMethodFilter('');
    setDateFromFilter(null);
    setDateToFilter(null);
    setAssignedToFilter(null);
    setSortField('activityTimestamp');
    setSortDirection('desc');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate ? timestamp.toDate().toLocaleString() : new Date(timestamp).toLocaleString();
  };

  // Options for Status and Method dropdowns
  const statusOptions = ["Open", "In Progress", "Resolved", "Needs Follow-up", "Waiting for Client"];
  const methodOptions = ["Phone", "Email", "In-Person Meeting", "Virtual Meeting", "Document Submission", "Internal Task"];

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Activity Log</h2>
      
      {/* Filter Section */}
      <div className="mb-6 p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-bold text-gray-700 mb-3">Filter Activities</h3>
        
        {/* Date Presets Row */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => setDateRangePreset('Today')} className="btn-secondary text-xs px-2 py-1">Today</button>
          <button onClick={() => setDateRangePreset('Yesterday')} className="btn-secondary text-xs px-2 py-1">Yesterday</button>
          <button onClick={() => setDateRangePreset('ThisWeek')} className="btn-secondary text-xs px-2 py-1">This Week</button>
          <button onClick={() => setDateRangePreset('LastWeek')} className="btn-secondary text-xs px-2 py-1">Last Week</button>
          <button onClick={() => setDateRangePreset('ThisMonth')} className="btn-secondary text-xs px-2 py-1">This Month</button>
          <button onClick={() => setDateRangePreset('LastMonth')} className="btn-secondary text-xs px-2 py-1">Last Month</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="keywordFilter" className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
            <input 
              type="text"
              id="keywordFilter"
              placeholder="Client, Subject, Details..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="clientFilter" className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <Select
                id="clientFilter"
                options={clients}
                value={selectedClientFilter}
                onChange={(option) => setSelectedClientFilter(option)}
                placeholder="All Clients"
                isClearable
                className="mt-1 block w-full sm:text-sm react-select-container"
                classNamePrefix="react-select"
            />
          </div>

          <div>
            <label htmlFor="assignedToFilter" className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <Select
                id="assignedToFilter"
                options={users}
                value={assignedToFilter}
                onChange={(option) => setAssignedToFilter(option)}
                placeholder="Any Staff"
                isClearable
                className="mt-1 block w-full sm:text-sm react-select-container"
                classNamePrefix="react-select"
            />
          </div>

          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              id="statusFilter" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="methodFilter" className="block text-sm font-medium text-gray-700 mb-1">Contact Method</label>
            <select 
              id="methodFilter" 
              value={methodFilter} 
              onChange={(e) => setMethodFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Methods</option>
              {methodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="dateFromFilter" className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <DatePicker 
              id="dateFromFilter"
              selected={dateFromFilter}
              onChange={date => setDateFromFilter(date)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              isClearable
              placeholderText="Select start date"
            />
          </div>

          <div>
            <label htmlFor="dateToFilter" className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <DatePicker 
              id="dateToFilter"
              selected={dateToFilter}
              onChange={date => setDateToFilter(date)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              isClearable
              placeholderText="Select end date"
              minDate={dateFromFilter} // Ensure To date is not before From date
            />
          </div>

          {/* Sorting Options Row */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="sortField" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select 
                    id="sortField" 
                    value={sortField} 
                    onChange={(e) => setSortField(e.target.value)} 
                    className="form-select"
                >
                    <option value="activityTimestamp">Activity Date</option>
                    <option value="clientName">Client Name</option>
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="lastModifiedAt">Last Modified</option>
                    {/* Add other relevant fields here */}
                </select>
            </div>
            <div>
                <label htmlFor="sortDirection" className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                <select 
                    id="sortDirection" 
                    value={sortDirection} 
                    onChange={(e) => setSortDirection(e.target.value)} 
                    className="form-select"
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>
          </div>
        
          <div className="md:col-start-4 flex items-end justify-end">
            <button 
                onClick={handleResetFilters} 
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium"
            >
                Reset Filters
            </button>
          </div>
        </div>
      </div>

      {isLoading && <div className="text-center p-10">Loading activities...</div>}
      {!isLoading && error && <div className="text-center p-10 text-red-500">{error}</div>}
      {!isLoading && !error && activities.length === 0 && <div className="text-center p-10">No activities match your current filters.</div>}
      
      {!isLoading && !error && activities.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">Date & Time</th>
                <th className="table-th">Client Name</th>
                <th className="table-th">Subject</th>
                <th className="table-th">Assigned To</th>
                <th className="table-th">Method</th>
                <th className="table-th">Status</th>
                <th className="table-th">Priority</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td className="table-td">{formatDate(activity.activityTimestamp)}</td>
                  <td className="table-td">{activity.clientName}</td>
                  <td className="table-td">{activity.subject}</td>
                  <td className="table-td">{activity.assignedToName || 'N/A'}</td>
                  <td className="table-td">{activity.contactMethod}</td>
                  <td className="table-td">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${activity.status === 'Open' ? 'bg-yellow-100 text-yellow-800' : 
                        activity.status === 'Resolved' ? 'bg-green-100 text-green-800' : 
                        activity.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        activity.status === 'Needs Follow-up' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {activity.status}
                    </span>
                  </td>
                  <td className="table-td">{activity.priority}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium table-td">
                    <button 
                      onClick={() => navigate(`/log-activity/${activity.id}`)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteActivity(activity.id)} 
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityListPage; 