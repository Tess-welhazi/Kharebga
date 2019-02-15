var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var rooms = 0;

app.use(express.static('.'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/game.html');
});

server.listen(5000);

io.on('connection', function(socket){
	console.log('A user connected!'); // We'll replace this with our own events
  /**
   * Create a new game room and notify the creator of game.
   You can call join to subscribe the socket to a given channel in this case the channel 'room'
   */
  socket.on('createGame', function(data){
    socket.join('room-' + ++rooms);
    socket.emit('newGame', {name: data.name, room: 'room-'+rooms});
  });

  /**
   * Connect the Player 2 to the room he requested. Show error if room full.
   */
  socket.on('joinGame', function(data){
    var room = io.nsps['/'].adapter.rooms[data.room];
    if( room && room.length == 1){
      socket.join(data.room);
      // sends to everyone in the room channel which is just our 2 players!
      socket.broadcast.to(data.room).emit('player1', {});
      // sends the name and room data
      socket.emit('player2', {name: data.name, room: data.room })
    }
    else {
      socket.emit('err', {message: 'Sorry, The room is full!'});
    }
  });

  /**
   * Handle the turn played by either player and notify the other.
    this is listening to the clients waiting for the playTurn signal, telling it they played
    the server then shares the info with all the channel or "broadcasts it"
   */

  socket.on('playTurn', function(data){
    socket.broadcast.to(data.room).emit('turnPlayed', {
      tile: data.tile,
      room: data.room
    });
  });

  socket.on('Phase2_playTurn', function(data){
    socket.broadcast.to(data.room).emit('phase2_turnPlayed', {
      source: data.source,
      target: data.target,
      room: data.room,
    });
  });



  socket.on('newScore', function(data){
    var pions_X = 0; var pions_O = 0;
    console.log("server data: "+data.board);
      for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 5; j++) {
        if (data.board[i][j] == 'X') {
              pions_X++;
          }

          else if (data.board[i][j] == 'O') {
            pions_O++;
          }
        }
      }

      if (pions_X == 0) {
        socket.broadcast.to(data.room).emit('winnerIS', {winner: 'O'});

      }else if (pions_O == 0) {
        socket.broadcast.to(data.room).emit('winnerIS', {winner: 'X'});
      }

      console.log("pions X: "+ pions_X);
      console.log("pions O: "+ pions_O);

  });

  /**
   * Notify the players about the victor.
    Wait for client to tell it they won
   */
  socket.on('gameEnded', function(data){
    socket.broadcast.to(data.room).emit('gameEnd', data);
  });

  socket.on('phase1_end', function(data){
    socket.broadcast.to(data.room).emit('phase2_start');
  });

  // ends here
});
