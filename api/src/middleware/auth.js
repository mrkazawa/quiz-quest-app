// Authentication middleware
const requireTeacherAuth = (req, res, next) => {
  if (req.session && req.session.isTeacher === true) {
    next(); // User is authenticated as teacher
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

module.exports = {
  requireTeacherAuth
};
