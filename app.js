const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const multer = require('multer');

const upload = multer({
  dest: './public/uploads/',
  limits: {
    fileSize: 1000000,
    files: 1,
  },
});

const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const flash = require('connect-flash');

const index = require('./server/controllers/index');
const auth = require('./server/controllers/auth');
const comments = require('./server/controllers/comments');
const videos = require('./server/controllers/videos');
const images = require('./server/controllers/images');

const app = express();

const config = require('./server/config/config');

mongoose.connect(config.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('error', () => {
  console.error(
    'MongoDB Connection Error. Make sure MongoDB is running.',
  );
});
require('./server/config/passport')(passport);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'sometextgohere',
    saveUninitialized: true,
    resave: true,
    store: new MongoStore({
      url: config.url,
      collection: 'sessions',
    }),
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.get('/', index.show);
app.get('/login', auth.signin);
app.post(
  '/login',
  passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true,
  }),
);
app.get('/signup', auth.signup);
app.post(
  '/signup',
  passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true,
  }),
);
app.get('/profile', auth.isLoggedIn, auth.profile);
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
app.get(
  '/comments',
  comments.hasAuthorization,
  comments.list,
);
app.post(
  '/comments',
  comments.hasAuthorization,
  comments.create,
);
app.get('/videos', videos.hasAuthorization, videos.show);
app.post(
  '/videos',
  videos.hasAuthorization,
  upload.single('video'),
  videos.uploadVideo,
);
app.post(
  '/images',
  images.hasAuthorization,
  upload.single('image'),
  images.uploadImage,
);
app.get(
  '/images-gallery',
  images.hasAuthorization,
  images.show,
);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

app.use((err, req, res) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
  console.log(
    `Express server listening on port ${app.get('port')}`,
  );
});
