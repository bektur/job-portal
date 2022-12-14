const express = require('express');
const router = express.Router();
const auth = require('../auth');
const User = require('../models/user');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const multer = require('multer');
const upload = multer({});

/* GET home page. */
router.get('/', function(req, res, next) {
  
});

router.get("/free-endpoint", (req, res) => {
  res.json({ message: "You are free to access me anytime" });
});

// authentication endpoint
router.get("/auth-endpoint", auth, (req, res) => {
  res.json({ message: "You are authorized to access me" });
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  const { originalname, buffer, mimetype } = req.file;
  
  const params = { 
    Key: 'resumes/'+ originalname,
    Body: buffer,
    Bucket: 'applicant.resumes',
    ContentType: mimetype
  };

  const response = await S3.upload(params).promise();
  if (! response) {
    return res.json({ok: false, msg: 'Error when uploading'});
  }
  return res.json({ok: true, msg: 'Successfully uploaded', ...response});
})

router.get('/getFiles', async (req, res) => {
  const params = {
    Bucket: 'applicant.resumes',
    Delimiter: '/',
    Prefix: 'resumes/'
  };
  
  const response = await S3.listObjects(params).promise();
  res.send(response);
})

router.post('/register', 
[
  check('first_name').not().isEmpty(),
  check('last_name').not().isEmpty(),
  check('user_role').not().isEmpty(),
  check("email", "Please enter a valid email").isEmail(),
  check("password", "Please enter a valid password").isLength({
    min: 8
})], 
function(req, res, next) {  
  const errors = validationResult(req);  
  if (!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array(), ok: false});
  }
  const {first_name, last_name, email, password, user_role } = req.body;  
  const userdetail = {first_name, last_name, email, password, user_role};     
  
  User.countDocuments({email}, (err, count) => {        
    if (count > 0) {  
      return res.json({ok: false, msg: 'An account already exists with this email address', duplicate: true});
    } else { 
      const user = new User(userdetail);
      user.save(function(err) {
        if (err) {
          return res.json({ok: false, err: err});
        }
        return res.json({ok: true, msg: 'Successfully saved user', user: { first_name, last_name, email, user_role, loggedIn: true }});
      })
    }
  })  
});

router.post('/signin', 
[
  check("email", "Please enter a valid email").isEmail(),
  check("password", "Please enter a valid password").isLength({
    min: 8
})],
async (req, res, next) => {    
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array(), ok: false});
  }

  const { email, password } = req.query ? req.query : req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({msg: 'No account exits for this email', ok: false});
    }

    const isMatch = await bcrypt.compare(password, user.password);    
    if (!isMatch) {
      return res.status(400).json({msg: 'Incorrect password', ok: false});
    }

    const payload = {
      user: {
        userId: user._id,
        userEmail: user.email
      }
    };

    // create JWT token
    const token = await new Promise((resolve, reject) => {
      jwt.sign(payload.user, 
        'RANDOM-TOKEN', 
        { expiresIn: '24hr' }, 
        (err, token) => {
          if (err) reject(err);
          return resolve(token);
        }
      );  
    })

    return res.status(200).send({user: {
      loggedIn: true, 
      first_name: user.first_name, 
      last_name: user.last_name, 
      email: user.email, 
      user_role: user.user_role,
      token
    },  ok: true});
  } catch (err) {
    console.log(err);
    res.status(500).json({msg: 'Server Error'});
  }
});

module.exports = router;
