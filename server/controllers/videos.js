const fs = require('fs');
const Videos = require('../models/videos');

const VIDEO_TYPES = [
  'video/mp4',
  'video/ogg',
  'video/ogv',
  'video/webm',
];

exports.show = (req, res) => {
  Videos.find()
    .sort('-created')
    .populate('user', 'local.email')
    .exec((error, videos) => {
      if (error) {
        return res.status(400).send({
          message: error,
        });
      }
      console.log(videos);
      res.status(200).json(videos);
    });
};

exports.uploadVideo = (req, res) => {
  let src;
  let dest;
  let targetPath;
  console.log(req);
  let tempPath = req.file.path;
  let type = req.file.mimetype;
  req.file.path.split(/[. ]+/).pop();
  if (VIDEO_TYPES.indexOf(type) == -1) {
    return res
      .status(415)
      .send('Supported video formats: mp4, webm, ogg, ogv');
  }
  targetPath = `./public/videos/${req.file.originalname}`;
  src = fs.createReadStream(tempPath);
  dest = fs.createWriteStream(targetPath);
  src.pipe(dest);

  src.on('error', (error) => {
    if (error) {
      return res.status(500).send({
        message: error,
      });
    }
  });

  src.on('end', () => {
    let video = new Videos(req.body);
    video.videoName = req.file.originalname;
    video.user = req.user;
    video.save((error) => {
      if (error) {
        return res.status(400).send({
          message: error,
        });
      }
    });
    fs.unlink(tempPath, (err) => {
      if (err) {
        return res.status(500).send({
          message: err,
        });
      }
      res.redirect('videos');
    });
  });
};

exports.hasAuthorization = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};
