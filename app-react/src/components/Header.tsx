import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogout?: boolean;
  showBack?: boolean;
  backTo?: string;
  roomId?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title,
  subtitle,
  showLogout = false,
  showBack = false,
  backTo,
  roomId
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="header-component bg-dark text-white py-3 shadow-sm">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-auto">
            {showBack && (
              <button 
                className="btn btn-link text-white p-0 me-3"
                onClick={handleBack}
                style={{ textDecoration: 'none' }}
              >
                <i className="bi bi-arrow-left fs-4"></i>
              </button>
            )}
          </div>
          
          <div className="col">
            <div className="text-center">
              {title && (
                <h4 className="mb-0 text-white fw-semibold">{title}</h4>
              )}
              {subtitle && (
                <p className="mb-0 text-white-50 small">{subtitle}</p>
              )}
              {roomId && !title && (
                <div>
                  <small className="text-white-50">Room ID</small>
                  <h5 className="mb-0 text-white fw-bold">{roomId}</h5>
                </div>
              )}
            </div>
          </div>

          <div className="col-auto">
            {showLogout && (
              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                <span className="d-none d-md-inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
