import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface TeacherLoginModalProps {
  show: boolean;
  onHide: () => void;
}

const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({ show, onHide }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        setPassword('');
        setShowPassword(false);
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
    setShowPassword(false);
    setError('');
    setIsLoading(false);
    onHide();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const clearError = () => {
    setError('');
  };

  if (!show) return null;

  return (
    <>
      {/* Bootstrap Modal Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        onClick={handleClose}
        style={{ zIndex: 1040 }}
      ></div>
      
      {/* Modal */}
      <div 
        className="modal fade show" 
        style={{ display: 'block', zIndex: 1050 }}
        tabIndex={-1}
        aria-hidden="false"
        onClick={handleBackdropClick}
      >
        <div className="modal-dialog">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-primary">
              <h5 className="modal-title text-white">Teacher Authentication</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>Please enter the teacher password to continue:</p>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${error ? 'is-invalid' : ''}`}
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
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  {error && (
                    <div className="invalid-feedback" style={{ display: 'block' }}>
                      {error}
                    </div>
                  )}
                </div>
              </form>
            </div>
            <div className="modal-footer justify-content-end">
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => handleSubmit()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    {' '}Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherLoginModal;
