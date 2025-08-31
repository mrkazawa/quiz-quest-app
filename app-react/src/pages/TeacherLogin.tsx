import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const TeacherLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        // Store teacher session
        localStorage.setItem('isTeacher', 'true');
        localStorage.setItem('teacherId', Date.now().toString());
        navigate('/teacher/dashboard');
      } else {
        setError(data.message || 'Incorrect password. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <div className="homepage-container">
      <div className="homepage-content">
        <div className="text-center">
          <Link to="/">
            <img
              src="/quiz-quest-logo.png"
              alt="Quiz Quest Logo"
              className="img-fluid mb-4"
              style={{ maxHeight: '120px' }}
            />
          </Link>

          <div className="card mx-auto" style={{ maxWidth: '400px' }}>
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">Teacher Authentication</h5>
            </div>
            <div className="card-body">
              <p className="mb-3">Please enter the teacher password to continue:</p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${error ? 'is-invalid' : ''}`}
                      id="teacherPassword"
                      placeholder="Enter password"
                      value={password}
                      onChange={handlePasswordChange}
                      disabled={isLoading}
                      autoComplete="current-password"
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
                    <div className="invalid-feedback d-block">
                      {error}
                    </div>
                  )}
                </div>
                
                <div className="d-flex gap-2">
                  <Link to="/" className="btn btn-secondary flex-fill">
                    Cancel
                  </Link>
                  <button 
                    type="submit" 
                    className="btn btn-primary flex-fill"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Verifying...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;
