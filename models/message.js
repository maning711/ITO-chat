var mongoose = require('mongoose');
var Schema = mogoose.Schema,
  ObjectId = Schema.ObjectId;

var Message = new Schema({
    content: String,
    creator: {
        _id: ObjectId,
        email: String,
        name: String,
        avatarUrl: String
    },
    createAt: {type: Date, defualt: Date.now}
})

module.exports = Message