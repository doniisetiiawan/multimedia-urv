exports.signin = (req, res) => {
  res.send('Login Page!');
};

exports.signup = (req, res) => {
  res.send('Signup Page');
};

exports.profile = (req, res) => {
  res.send('Profile Page');
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};
