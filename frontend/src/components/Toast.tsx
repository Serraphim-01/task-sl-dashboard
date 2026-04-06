import React, { useEffect } from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  isVisible, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-600 text-green-100';
      case 'error':
        return 'bg-red-900/90 border-red-600 text-red-100';
      case 'info':
        return 'bg-blue-900/90 border-blue-600 text-blue-100';
      default:
        return 'bg-green-900/90 border-green-600 text-green-100';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-400" size={20} />;
      case 'error':
        return <FaTimes className="text-red-400" size={20} />;
      case 'info':
        return <FaCheckCircle className="text-blue-400" size={20} />;
      default:
        return <FaCheckCircle className="text-green-400" size={20} />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-lg border shadow-2xl backdrop-blur-sm ${getToastStyles()}`}>
        {getIcon()}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
