/**
 * created by maning 
 */
var express = require('express');
var async = require('async')
var bodyParser = require('body-parser');
var cookieParser = require('cookie-Parser');
var session = require('express-session');
var app = express();
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
        maxAge: 60 * 1000 * 60
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

var SYSTEM = {
  name: '社内chat',
  avatarUrl: 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Robot_icon.svg/220px-Robot_icon.svg.png'
}

io.sockets.on('connection', function(socket) {
  var _userId = socket.request.session._userId
  Controllers.User.online(_userId, function(err, user) {
    if (err) {
      socket.emit('err', {
        mesg: err
      })
    } else {
      socket.broadcast.emit('users.add', user)
      socket.broadcast.emit('messages.add', {
        content: user.name + '进入了聊天室',
        creator: SYSTEM,
        createAt: new Date()
      })
    }
  })
  socket.on('disconnect', function() {
    Controllers.User.offline(_userId, function(err, user) {
      if (err) {
        socket.emit('err', {
          mesg: err
        })
      } else {
        socket.broadcast.emit('users.remove', user)
        socket.broadcast.emit('messages.add', {
          content: user.name + '离开了聊天室',
          creator: SYSTEM,
          createAt: new Date()
        })
      }
    })
  });
  socket.on('technode.read', function() {
    async.parallel([

        function(done) {
          Controllers.User.getOnlineUsers(done)
        },
        function(done) {
          Controllers.Message.read(done)
        }
      ],
      function(err, results) {
        if (err) {
          socket.emit('err', {
            msg: err
          })
        } else {
          socket.emit('technode.read', {
            users: results[0],
            messages: results[1]
          })
        }
      });
  })
  socket.on('messages.create', function(message) {
    Controllers.Message.create(message, function(err, message) {
      if (err) {
        socket.emit('err', {
          msg: err
        })
      } else {
        io.sockets.emit('messages.add', message)
      }
    })
  })
})