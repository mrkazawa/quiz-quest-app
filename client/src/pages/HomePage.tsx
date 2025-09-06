import { useState } from 'react';
import TeacherLoginModal from '../components/TeacherLoginModal';

const HomePage = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center">
          <img
            src="/quiz-quest-logo.png"
            alt="Quiz Quest Logo"
            className="mx-auto mb-6"
            style={{ maxHeight: '120px' }}
          />

          <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome!</h2>
          <p className="text-lg text-gray-600 mb-8">Login to get started</p>

          <div className="space-y-4">
            <button 
              onClick={() => setShowLoginModal(true)}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
            >
              Password Login
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Login Modal */}
      <TeacherLoginModal 
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default HomePage;
