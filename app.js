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
var signedCookieParser = cookieParser('techcode');
var MongoStore = require('connect-mongo')(session);
var sessionStore = new MongoStore({
    url: 'mongodb://localhost/techcode'
});

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
    },
    store: sessionStore
}));

app.get('/api/validate', function(req, res) {
    var userId = req.session._userId;
    if (userId) {
        Controllers.User.findUserById(userId, function(err, user) {
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

io.use(function(socket, next){
    var handshakeData = socket.request;
    signedCookieParser(handshakeData, {}, function(err) {
        if (err) {
            next(new Error());
        } else {
            sessionStore.get(handshakeData.signedCookies['connect.sid'], function(err, session) {
                if (err) {
                    next(new Error(err.message));
                } else {
                    handshakeData.session = session;
                    if (session._userId) {
                        next();
                    } else {
                        next(new Error('No login'));
                    }
                }
            })
        }
    })
});
io.sockets.on('connection', function (socket) {
    socket.on('getAllMessages', function () {
        socket.emit('allMessages', messages);
    });
    socket.on('createMessage', function (message) {
        messages.push(message);
        debugger;
        socket.emit('messageAdded', message);
    });
});