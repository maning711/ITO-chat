/**
 * created by maning
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    email: String,
    name: String,
    avatrarUrl: String
});

module.exports = User;