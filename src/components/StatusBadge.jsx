import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeClasses = 'text-xs px-2 py-0.5 rounded-full';
  switch (status) {
    case 'Open':
      badgeClasses += ' bg-yellow-100 text-yellow-800';
      break;
    case 'In Progress':
      badgeClasses += ' bg-blue-100 text-blue-800';
      break;
    case 'Resolved':
      badgeClasses += ' bg-green-100 text-green-800';
      break;
    case 'Needs Follow-up':
      badgeClasses += ' bg-red-100 text-red-800';
      break;
    case 'Waiting for Client':
      badgeClasses += ' bg-purple-100 text-purple-800';
      break;
    default:
      badgeClasses += ' bg-gray-100 text-gray-800';
      break;
  }

  return <span className={badgeClasses}>{status}</span>;
};

export default StatusBadge; 