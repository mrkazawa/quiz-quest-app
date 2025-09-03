import { useState } from 'react';
import { Link } from 'react-router-dom';
import TeacherLoginModal from '../components/TeacherLoginModal';

const HomePage = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  return (
    <div className="homepage-container">
      <div className="homepage-content">
        <div className="text-center">
          <img
            src="/quiz-quest-logo.png"
            alt="Quiz Quest Logo"
            className="img-fluid mb-4"
            style={{ maxHeight: '120px' }}
          />

          <h2 className="mb-4">Welcome!</h2>
          <p className="lead mb-4">Choose your role to get started:</p>

          <div className="d-grid gap-3 mx-auto home-buttons">
            <button 
              onClick={() => setShowLoginModal(true)}
              className="btn btn-lg btn-primary"
            >
              I'M A TEACHER
            </button>
            <Link to="/student/join" className="btn btn-lg btn-success">
              I'M A STUDENT
            </Link>
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
