import { Link } from 'react-router-dom';

const HomePage = () => {
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
            <Link to="/teacher/login" className="btn btn-lg btn-primary">
              I'M A TEACHER
            </Link>
            <Link to="/student/join" className="btn btn-lg btn-success">
              I'M A STUDENT
            </Link>
            
            {/* Language Toggle - will implement in next iteration */}
            <div className="d-flex justify-content-center align-items-center mt-2 mb-2">
              <div className="btn-group" role="group" aria-label="Language Toggle">
                <button type="button" className="btn btn-outline-secondary btn-sm" style={{ minWidth: '45px' }}>
                  ENG
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" style={{ minWidth: '45px' }}>
                  IND
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
