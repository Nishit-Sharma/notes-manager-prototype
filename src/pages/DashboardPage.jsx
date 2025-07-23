import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';

const DashboardPage = () => {
  const { currentUser, userData } = useAuth();
  const [totalActivities, setTotalActivities] = useState(0);
  const [activitiesByStatus, setActivitiesByStatus] = useState({});
  const [myActivities, setMyActivities] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadsPending, setInitialLoadsPending] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const expectedLoads = (userData && userData.uid) ? 3 : 2;
    setInitialLoadsPending(expectedLoads);

    const markLoadComplete = () => {
      setInitialLoadsPending(prev => {
        const newPending = prev - 1;
        if (newPending === 0) {
          setLoading(false);
        }
        return newPending;
      });
    };

    const activityLogsRef = collection(db, 'activityLogs');
    const unsubscribeStats = onSnapshot(activityLogsRef, (snapshot) => {
      let statusCounts = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        statusCounts[data.status] = (statusCounts[data.status] || 0) + 1;
      });
      setTotalActivities(snapshot.size);
      setActivitiesByStatus(statusCounts);
      markLoadComplete(); 
    }, (error) => {
      console.error("Error fetching activity stats: ", error);
      markLoadComplete();
    });

    let unsubscribeMyActivities = null;
    if (userData && userData.uid) {
      const myActivitiesQuery = query(
        activityLogsRef,
        where('assignedToUserId', '==', userData.uid),
        orderBy('activityTimestamp', 'desc'),
        limit(10)
      );
      unsubscribeMyActivities = onSnapshot(myActivitiesQuery, (snapshot) => {
        setMyActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        markLoadComplete();
      }, (error) => {
        console.error("Error fetching user's activities: ", error);
        markLoadComplete();
      });
    } else if (initialLoadsPending === expectedLoads && expectedLoads === 3) {
        markLoadComplete();
    }
    
    const recentActivitiesQuery = query(activityLogsRef, orderBy('activityTimestamp', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(recentActivitiesQuery, (snapshot) => {
      setRecentActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      markLoadComplete();
    }, (error) => {
      console.error("Error fetching recent activities: ", error);
      markLoadComplete();
    });
    
    return () => {
      unsubscribeStats();
      if (unsubscribeMyActivities) unsubscribeMyActivities();
      unsubscribeRecent();
    };
  }, [currentUser, userData]);

  if (loading) {
    return <div className="p-6 text-center">Loading dashboard data...</div>;
  }

  if (!currentUser) {
    return <div className="p-6 text-center">Please <Link to="/login" className="text-blue-600 hover:underline">login</Link> to view the dashboard.</div>;
  }

  const statusOrder = ['Open', 'In Progress', 'Needs Follow-up', 'Waiting for Client', 'Resolved'];


  return (
    <div className="p-4 space-y-6 md:p-6">
      <h1 className="text-3xl font-bold text-gray-800">Activity Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow transition-shadow hover:shadow-md">
          <h2 className="text-xl font-semibold text-gray-700">Total Activities</h2>
          <p className="text-3xl font-bold text-blue-600">{totalActivities}</p>
        </div>
        {statusOrder.map(status => (
          activitiesByStatus[status] > 0 && (
            <div key={status} className="p-6 bg-white rounded-lg shadow transition-shadow hover:shadow-md">
              <h2 className="text-xl font-semibold text-gray-700">{status}</h2>
              <p className="text-3xl font-bold text-blue-600">{activitiesByStatus[status] || 0}</p>
            </div>
          )
        ))}
         {Object.entries(activitiesByStatus)
          .filter(([status, count]) => !statusOrder.includes(status) && count > 0)
          .map(([status, count]) => (
             <div key={status} className="p-6 bg-white rounded-lg shadow transition-shadow hover:shadow-md">
                <h2 className="text-xl font-semibold text-gray-700">{status}</h2>
                <p className="text-3xl font-bold text-blue-600">{count}</p>
            </div>
        ))}
      </div>
      {userData && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-2xl font-bold text-gray-700">My Open Activities ({myActivities.filter(act => act.status !== 'Resolved').length})</h2>
          {myActivities.filter(act => act.status !== 'Resolved').length > 0 ? (
            <ul className="space-y-3">
              {myActivities.filter(act => act.status !== 'Resolved').map(activity => (
                <li key={activity.id} className="p-3 bg-gray-50 rounded-md transition-colors hover:bg-gray-100">
                  <Link to={`/log-activity/${activity.id}`} className="block">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-700">{activity.subject}</span>
                      <StatusBadge status={activity.status} />
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
      
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-2xl font-bold text-gray-700">Recent Activities (Last 5)</h2>
        {recentActivities.length > 0 ? (
          <ul className="space-y-3">
            {recentActivities.map(activity => (
              <li key={activity.id} className="p-3 bg-gray-50 rounded-md transition-colors hover:bg-gray-100">
                 <Link to={`/log-activity/${activity.id}`} className="block">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-700">{activity.subject}</span>
                       <span className="text-sm text-gray-500">{activity.clientName}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                            Logged: {activity.activityTimestamp?.toDate().toLocaleDateString()} by {activity.assignedToName || activity.createdByUserName || 'N/A'}
                        </span>
                        <StatusBadge status={activity.status} />
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