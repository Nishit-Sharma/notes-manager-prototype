import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { currentUser, userData } = useAuth();
  const [totalActivities, setTotalActivities] = useState(0);
  const [activitiesByStatus, setActivitiesByStatus] = useState({});
  const [myActivities, setMyActivities] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // --- General Activity Stats ---
    const activityLogsRef = collection(db, 'activityLogs');

    // Get total activities & activities by status
    const unsubscribeStats = onSnapshot(activityLogsRef, (snapshot) => {
      let statusCounts = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        statusCounts[data.status] = (statusCounts[data.status] || 0) + 1;
      });
      setTotalActivities(snapshot.size);
      setActivitiesByStatus(statusCounts);
    }, (error) => {
      console.error("Error fetching activity stats: ", error);
    });

    // --- Activities assigned to current user ---
    // Ensure userData and userData.uid are available
    let unsubscribeMyActivities;
    if (userData && userData.uid) {
      const myActivitiesQuery = query(
        activityLogsRef,
        where('assignedToUserId', '==', userData.uid),
        orderBy('activityTimestamp', 'desc'),
        limit(10) // Show up to 10 of user's most recent
      );
      unsubscribeMyActivities = onSnapshot(myActivitiesQuery, (snapshot) => {
        setMyActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Error fetching user's activities: ", error);
      });
    } else {
      // If userData is not yet loaded, or no uid, set myActivities to empty or handle appropriately
      setMyActivities([]);
    }
    

    // --- 5 Most Recent Activities ---
    const recentActivitiesQuery = query(activityLogsRef, orderBy('activityTimestamp', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(recentActivitiesQuery, (snapshot) => {
      setRecentActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching recent activities: ", error);
    });
    
    setLoading(false); // Initial load done, real-time updates will continue

    return () => {
      unsubscribeStats();
      if (unsubscribeMyActivities) unsubscribeMyActivities();
      unsubscribeRecent();
    };
  }, [currentUser, userData]); // Re-run if currentUser or userData changes

  if (loading && (!totalActivities && Object.keys(activitiesByStatus).length === 0) ) { // More robust loading check
    return <div className="p-6 text-center">Loading dashboard data...</div>;
  }

  if (!currentUser) {
    return <div className="p-6 text-center">Please <Link to="/login" className="text-blue-600 hover:underline">login</Link> to view the dashboard.</div>;
  }

  const statusOrder = ['Open', 'In Progress', 'Needs Follow-up', 'Waiting for Client', 'Resolved'];


  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Activity Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-700">Total Activities</h2>
          <p className="text-3xl font-bold text-blue-600">{totalActivities}</p>
        </div>
        {statusOrder.map(status => (
          activitiesByStatus[status] > 0 && (
            <div key={status} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-gray-700">{status}</h2>
              <p className="text-3xl font-bold text-blue-600">{activitiesByStatus[status] || 0}</p>
            </div>
          )
        ))}
         {Object.entries(activitiesByStatus)
          .filter(([status, count]) => !statusOrder.includes(status) && count > 0)
          .map(([status, count]) => (
             <div key={status} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold text-gray-700">{status}</h2>
                <p className="text-3xl font-bold text-blue-600">{count}</p>
            </div>
        ))}
      </div>

      {/* My Assigned Activities */}
      {userData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">My Open Activities ({myActivities.filter(act => act.status !== 'Resolved').length})</h2>
          {myActivities.filter(act => act.status !== 'Resolved').length > 0 ? (
            <ul className="space-y-3">
              {myActivities.filter(act => act.status !== 'Resolved').map(activity => (
                <li key={activity.id} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <Link to={`/log-activity/${activity.id}`} className="block">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-700">{activity.subject}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activity.status === 'Open' ? 'bg-yellow-200 text-yellow-800' :
                        activity.status === 'In Progress' ? 'bg-blue-200 text-blue-800' :
                        activity.status === 'Needs Follow-up' ? 'bg-red-200 text-red-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>{activity.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">Client: {activity.clientName}</p>
                    <p className="text-xs text-gray-500">
                      Logged: {activity.activityTimestamp?.toDate().toLocaleDateString()}
                      {activity.followUpDate && ` | Follow-up: ${activity.followUpDate.toDate().toLocaleDateString()}`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">You have no open activities assigned to you.</p>
          )}
        </div>
      )}
      
      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Recent Activities (Last 5)</h2>
        {recentActivities.length > 0 ? (
          <ul className="space-y-3">
            {recentActivities.map(activity => (
              <li key={activity.id} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                 <Link to={`/log-activity/${activity.id}`} className="block">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-700">{activity.subject}</span>
                       <span className="text-sm text-gray-500">{activity.clientName}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                            Logged: {activity.activityTimestamp?.toDate().toLocaleDateString()} by {activity.assignedToName || 'N/A'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activity.status === 'Open' ? 'bg-yellow-200 text-yellow-800' :
                        activity.status === 'In Progress' ? 'bg-blue-200 text-blue-800' :
                        activity.status === 'Resolved' ? 'bg-green-200 text-green-800' :
                        activity.status === 'Needs Follow-up' ? 'bg-red-200 text-red-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>{activity.status}</span>
                    </div>
                 </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No activities logged yet.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 