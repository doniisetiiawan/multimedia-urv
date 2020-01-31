const fs = require('fs');
const mime = require('mime');
const Images = require('../models/images');

const IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
];

exports.show = (req, res) => {
  Images.find()
    .sort('-created')
    .populate('user', 'local.email')
    .exec((error, images) => {
      if (error) {
        return res.status(400).send({
          message: error,
        });
      }
      res.status(200).json(images);
    });
};

exports.uploadImage = function (req, res) {
  let src;
  let dest;
  let targetPath;
  const tempPath = req.file.path;
  console.log(req.file);
  const type = mime.lookup(req.file.mimetype);
  req.file.path.split(/[. ]+/).pop();
  if (IMAGE_TYPES.indexOf(type) == -1) {
    return res
      .status(415)
      .send(
        'Supported image formats: jpeg, jpg, jpe, png.',
      );
  }
  targetPath = `./public/images/${req.file.originalname}`;
  src = fs.createReadStream(tempPath);
  dest = fs.createWriteStream(targetPath);
  src.pipe(dest);

  src.on('error', (err) => {
    if (err) {
      return res.status(500).send({
        message: err,
      });
    }
  });

  src.on('end', () => {
    const image = new Images(req.body);
    image.imageName = req.file.originalname;
    image.user = req.user;
    image.save((error) => {
      if (error) {
        return res.status(400).send({ message: error });
      }
    });
    fs.unlink(tempPath, (err) => {
      if (err) {
        return res
          .status(500)
          .send('Woh, something bad happened here');
      }
      res.redirect('images-gallery');
    });
  });
};

exports.hasAuthorization = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};
