import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface TeacherLoginModalProps {
  show: boolean;
  onHide: () => void;
}

const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({ show, onHide }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        setPassword('');
        setError('');
        setIsLoading(false);
        onHide();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [show, onHide]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // Generate or retrieve teacher ID for session persistence
        let teacherId = localStorage.getItem('teacherId');
        if (!teacherId) {
          teacherId = 'teacher_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('teacherId', teacherId);
        }
        
        // Set authentication status and redirect to teacher dashboard
        login(teacherId);
        onHide();
        navigate('/teacher/dashboard');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop, not the modal content
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setIsLoading(false);
    onHide();
  };

  const clearError = () => {
    setError('');
  };

  if (!show) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40" 
        onClick={handleClose}
      ></div>
      
      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="bg-primary-600 text-white rounded-t-lg px-6 py-4 flex items-center justify-between">
            <h5 className="text-lg font-semibold">Password Login</h5>
            <button
              type="button"
              className="text-white hover:text-gray-200 transition-colors"
              onClick={handleClose}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-4">Please enter the teacher password to continue:</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="password"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  id="teacherPassword"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  autoFocus
                />
                {error && (
                  <div className="text-red-600 text-sm mt-2">
                    {error}
                  </div>
                )}
              </div>
            </form>
          </div>
          <div className="px-6 pb-6 flex justify-end">
            <button 
              type="button" 
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={() => handleSubmit()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherLoginModal;
