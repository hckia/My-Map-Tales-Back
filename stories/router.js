'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const {Story} = require('./models');

const router = express.Router();

const jsonParser = bodyParser.json();

const jwtAuth = passport.authenticate('jwt', { session: false });


// Post to register a new user
router.post('/', jwtAuth , jsonParser, (req, res) => {
  console.log(req.body.title)
  // {title, description, location, date, author, body}
  const author = req.user.username;
  console.log(author);
  const requiredFields = ['title', 'description', 'location', 'date', 'body'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    console.log("missingField fired ")
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  if(!author){
    console.log("no author fired ");
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: author
    });
  }

  const stringFields = ['title', 'description', 'location', 'date', 'body'];
  console.log(stringFields.find(field => console.log('Current FIeld ' + field + ' ' + req.body[field])))
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    console.log("nonStringField fired ")
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  const sizedFields = {
    title: {
      min: 1,
      max: 50
    },
    description: {
      min: 20,
      max: 70
    },
    body: {
      min: 140,
      max: 30000
    }
  };

  const keysToTestSize = {title: req.body.title, description: req.body.description, body: req.body.body}
  console.log(keysToTestSize.title.length)
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            keysToTestSize[field].length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            keysToTestSize[field].length > sizedFields[field].max
  );
  // const tooSmallField = () => {
  //   //console.log("action fired: ", action);
  //   switch(action.type){
  //   case FETCH_STORIES:
  //     return _.mapKeys(action.payload, '_id')
  //   case SEARCH_STORIES:
  //     //console.log('within reducers term value: ',action.payload);
  //     return action.payload;
  //   // case CREATE_STORIES:
  //   //  return action.payload;
  //   default:
  //     return state;
  //   }
  // }

  if (tooSmallField || tooLargeField) {
    console.log("tooSmallField fired ", tooSmallField)
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `The ${tooSmallField || tooLargeField} must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `The ${tooSmallField || tooLargeField} must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  let {title, description, location, date, body} = req.body;
  // Username and password come in pre-trimmed, otherwise we throw an error
  // before this
  // var title = req.body.title;
  // var author = req.body.author;

  var authorStoryExists = {title: title, author: author}
  return Story.findOne(authorStoryExists)
    .count()
    .then(count => {
      if (count > 0) {
        console.log("count greater than zero where Title and author match ");
        // There is an existing user with the same username
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Story already taken',
          location: 'author'
        });
      }
      // If there is no existing user, hash the password
      return Story.create({
        title,
        description,
        location,
        date,
        author,
        body
      });
    })
    .then(story => {
      return res.status(201).json(story);
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened
      console.log("catch error fired ")
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });
});

// Never expose all your users like below in a prod application
// we're just doing this so we have a quick way to see
// if we're creating users. keep in mind, you can also
// verify this in the Mongo shell.
router.get('/', (req, res) => {
  return Story.find()
    .then(stories => res.json(stories.map(story => story)))
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

module.exports = {router};
