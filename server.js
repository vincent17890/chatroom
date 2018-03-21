var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    bodyParser = require('body-parser'),
    io = require('socket.io').listen(http),
    _ = require('underscore');

/*
List of participants
{
  id: 'sessionId',
  name: 'participantName'
}
*/

var participants = [];

/* Server config */

// server's ip address
app.set('ipaddr', '127.0.0.1');
// server's port number
app.set('port', '8080');

app.use(bodyParser.json());

app.set('views', __dirname + '/views');

app.set('view engine', 'jade');

app.use(express.static('public', __dirname + '/public'));

app.post('/message', function(req, res)
{
  var message = req.body.message;
  if(_.isUndefined(message)||_.isEmpty(message.trim()))
  {
    return res.json(400, {error: 'Message is invalid'});
  }
  // Participant's name should be noted
  var name = req.body.name;
  io.sockets.emit('incomingMessage', {message: message, name: name});
  res.json(200, {message: 'Message received'});
}
);

/* Socket.IO events */
io.on('connection', function(socket)
{
  /*
  New user enter
  */
  socket.on('newUser', function(data)
  {
    participants.push({id: data.id, name: data.name});
    io.sockets.emit('newConnection', {participants: participants});
  }
  );
  /*
  Users change name
  */
  socket.on('nameChange', function(data)
  {
    _.findWhere(participants, {id: socket.id}).name = data.name;
    io.sockets.emit('nameChanged', {id: data.id, name: data.name});
  }
  );
  /*
  Client disconnects
  */
  socket.on('disconnect', function()
  {
    participants = _.without(participants, _.findWhere(participants, {id: socket.id}));
    io.sockets.emit('userDisconnected', {id: socket.id, sender: 'system'});
  }
  );

}
);

/* Server routing */
app.get('/', function(req, res)
{
  res.render('index');
}
);

// start the app server
http.listen(app.get('port'), app.get('ipaddr'), function()
{
  console.log('Server is up and running. Go to http://' + app.get('ipaddr') + '/' + app.get('port'));
}
);

// Handling GET, as in 'http://localhost:8080/'
