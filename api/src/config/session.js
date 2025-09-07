const session = require("express-session");

const sessionConfig = {
  secret: process.env.SESSION_SECRET || "quiz-app-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

const middleware = session(sessionConfig);

module.exports = {
  config: sessionConfig,
  middleware
};
