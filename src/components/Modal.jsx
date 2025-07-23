import React from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onConfirm, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="flex overflow-y-auto fixed inset-0 z-50 justify-center items-center w-full h-full bg-gray-600 bg-opacity-50">
      <div className="relative p-5 mx-auto w-full max-w-lg bg-white rounded-md border shadow-lg">
        <div className="mt-3 text-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          <div className="px-7 py-3 mt-2">
            {children}
          </div>
          <div className="items-center px-4 py-3 space-x-2">
            {onConfirm ? (
              <>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                >
                  {confirmText}
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={onClose}
                >
                  {cancelText}
                </button>
              </>
            ) : (
              <button
                className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded hover:bg-gray-300"
                onClick={onClose}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal; 