const Comments = require('../models/comments');

exports.list = (req, res) => {
  Comments.find()
    .sort('-created')
    .populate('user', 'local.email')
    .exec((error, comments) => {
      if (error) {
        return res.send(400, {
          message: error,
        });
      }
      res.status(200).json(comments);
    });
};

exports.create = (req, res) => {
  const comments = new Comments(req.body);
  comments.user = req.user;
  comments.save((error) => {
    if (error) {
      return res.send(400, {
        message: error,
      });
    }
    res.redirect('/comments');
  });
};

exports.hasAuthorization = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};
