import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-200 text-center p-4 mt-auto">
      <p className="text-gray-600">&copy; {new Date().getFullYear()} Accounting Firm. All rights reserved.</p>
    </footer>
  );
};

export default Footer; 