'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

/* 

{
      "id": 1,
      "title": 'my trip to Rome', 
      "description": 'The time I feel in love with Italy and Lasanga', 
      "location": 'Rome, Italy',
      "date": '1/29/1985',
      "author": 'Bob Dohl',
      "body": 'Once upon a time I came to Rome. That plae was sick, yo! The food was great, the babes were great, the dudes were great, everything was great.'
    }
*/
const StorySchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {type: String, default: ''},
  location: {type: String, default: ''},
  date: {type: String, required: true}, // https://react-day-picker.js.org/
  author: {type: String, required: true},
  body: {type: String, required: true},
  followers: [{username: {type: String, required: true}}]
});

StorySchema.methods.serialize = function() {
  return {
    username: this.username || '',
    firstName: this.firstName || '',
    lastName: this.lastName || ''
  };
};

StorySchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

StorySchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const Story = mongoose.model('Story', StorySchema);

module.exports = {Story};
