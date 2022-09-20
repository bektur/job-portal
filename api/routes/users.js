require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({status: '1', msg: 'respond with a resource'});
});

router.post('/upload', function (req, res, next) {
  console.log(req);
  return res.json({'ok': true, msg: 'Successfully'});
  const { name, size, type } = req.body.file;
  const params = { 
    key: name,
    Body: req.body.file,
    Bucket: 'applicant.resumes',
    ContentType: type
  };

  const response = S3.upload(params).promise();
  console.log(response);
  return response;
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

  const { email, password } = req.body;
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
        id: user.id
      }
    };

    jwt.sign(payload, 
            'randomString', 
            {
              expiresIn: 3600
            }, 
            (err, token) => {
              if (err) throw err;
              res.status(200).json({ token,  ok: false});
            }
          );

    return res.json({user: {
      loggedIn: true, 
      first_name: user.first_name, 
      last_name: user.last_name, 
      email: user.email, 
      user_role: user.user_role
    },  ok: true});
  } catch (err) {
    console.log(err);
    res.status(500).json({msg: 'Server Error'});
  }
});

module.exports = router;
