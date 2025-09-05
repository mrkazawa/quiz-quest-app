import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer-component bg-dark text-white py-3 mt-auto">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <small className="text-white-50">
              © 2025 Quiz Quest. Licensed under{' '}
              <a 
                href="https://opensource.org/licenses/MIT" 
                className="text-white" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                MIT License
              </a>
            </small>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <small className="text-white-50">
              <a 
                href="https://github.com/mrkazawa/quiz-quest-app" 
                className="text-white" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <i className="bi bi-github me-1"></i>
                @github
              </a>
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
