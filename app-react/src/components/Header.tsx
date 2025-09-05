import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
  showBack?: boolean;
  backTo?: string;
}

const Header = ({ title, subtitle, showLogout = false, showBack = false, backTo = '/' }: HeaderProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    navigate(backTo);
  };

  return (
    <header className="bg-gradient-to-r from-slate-800 to-slate-700 text-white sticky top-0 z-50 border-b border-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            
            <div className="flex flex-col min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white truncate">{title}</h1>
              {subtitle && (
                <p className="text-sm text-slate-300 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {showLogout && (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
