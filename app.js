/**
 * created by maning 
 */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-Parser');
var session = require('express-session');
var Controllers = require('./controllers');
var path = require('path');

// set server's port
var port = process.env.PORT || 3000;

// messages' object
var messages = [];

// configue the express server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(session({
    secret: 'techcode',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 1000
    }
}));

app.get('/api/validate', function(req, res) {
    var _userId = req.session._userId;
    if (_userId) {
        Controllers.User.findUserById(_userId, function(err, user) {
            if (err) {
                res.json(401, {
                    msg: err
                });
            } else {
                res.json(user);
            }
        });
    } else {
        res.status(401).json(null);
    }
});

app.post('/api/login', function(req, res) {
    var email = req.body.email;
    debugger;
    if (email) {
        Controllers.User.findByEmailOrCreate(email, function(err, user) {
            if (err) {
                res.json(500, {
                    msg: err
                });
            } else {
                req.session._userId = user._id;
                res.json(user);
            }
        });
    } else {
        res.json(403);
    }
});

app.get('/api/logout', function(req, res) {
    req.session._userId = null;
    res.json(401);
})

// set static resouces path
app.use(express.static(path.join(__dirname, '/static')));
app.use(function (req, res) {
    res.sendFile(path.join(__dirname, './static/index.html'));
});

// listen the express server
var server = app.listen(port, function () {
    console.log('it is on port' + port);
});

// io object to listen express server
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
    socket.on('getAllMessages', function () {
        socket.emit('allMessages', messages);
    });
    socket.on('createMessage', function (message) {
        messages.push(message);
        socket.emit('messageAdded', message);
    });
});