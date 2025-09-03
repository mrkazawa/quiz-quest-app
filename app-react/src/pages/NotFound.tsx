import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <img
              src="/quiz-quest-logo.png"
              alt="Quiz Quest Logo"
              className="img-fluid mb-3"
              style={{ maxHeight: '80px', opacity: 0.7 }}
            />
            
            <h1 className="display-1 fw-bold text-primary mb-3">404</h1>
            <h2 className="mb-3">Page Not Found</h2>
            <p className="text-muted mb-4">
              Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
            
            <div className="d-grid gap-2 d-md-block mb-4">
              <Link to="/" className="btn btn-primary btn-lg me-md-2">
                <i className="bi bi-house-fill me-2"></i>
                Go Home
              </Link>
              <Link to="/student/join" className="btn btn-outline-success btn-lg">
                <i className="bi bi-person-plus me-2"></i>
                Join Quiz
              </Link>
            </div>
            
            <div>
              <small className="text-muted">
                Need help? Make sure you have the correct room code or URL.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
