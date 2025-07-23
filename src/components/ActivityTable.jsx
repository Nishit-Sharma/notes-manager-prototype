import React from 'react';
import StatusBadge from './StatusBadge';

const ActivityTable = ({ activities, formatDate, handleDeleteActivity, navigate }) => {
  if (!activities || activities.length === 0) {
    return <div className="p-4 text-center">No activities to display</div>;
  }

  return (
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
            <th className="text-right table-th">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td className="table-td">{formatDate(activity.activityTimestamp)}</td>
              <td className="font-medium table-td">{activity.clientName}</td>
              <td className="table-td">{activity.subject}</td>
              <td className="table-td">{activity.assignedToName || 'N/A'}</td>
              <td className="table-td">{activity.contactMethod}</td>
              <td className="table-td">
                <StatusBadge status={activity.status} />
              </td>
              <td className="table-td">{activity.priority}</td>
              <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                <button 
                  onClick={() => navigate(`/log-activity/${activity.id}`)}
                  className="mr-3 text-blue-600 hover:text-blue-900"
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
  );
};

export default ActivityTable; 