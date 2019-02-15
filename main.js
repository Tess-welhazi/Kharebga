(function init(){

  // Types of players
  var P1 = 'X', P2 = 'O';
  var socket = io.connect('http://localhost:5000'),
    player,
    game;

  /**
   * Create a new game. Emit newGame event.
   */

  $('#new').on('click', function(){
    var name = $('#nameNew').val();
    if(!name){
      alert('Please enter your name.');
      return;
    }
    socket.emit('createGame', {name: name});
    player = new Player(name, P1);
  });

  /**
   *  Join an existing game on the entered roomId. Emit the joinGame event.
   */

  $('#join').on('click', function(){
    var name = $('#nameJoin').val();
    var roomID = $('#room').val();
    if(!name || !roomID){
      alert('Please enter your name and game ID.');
      return;
    }
    socket.emit('joinGame', {name: name, room: roomID});
    player = new Player(name, P2);
  });

  // PLAYER OBJECT

  /**
   * Player class
   */
  var Player = function(name, type){
    this.name = name;
    this.type = type;
    this.currentTurn = true;
    this.movesPlayed = 0;

  }

  /**
   * Create a static array that stores all possible win combinations
   * w're changing this drastically because our game logic is different
   */
  Player.wins = [7, 56, 448, 73, 146, 292, 273, 84];

  /**
   * Set the bit of the move played by the player
   */

   // ne5dhou
  Player.prototype.updateMovesPlayed = function(tileValue){
    this.movesPlayed += tileValue;
  }
  // na3tiw
  Player.prototype.getMovesPlayed = function(){
    return this.movesPlayed;
  }

  /**
   * Set the currentTurn for player to turn and update UI to reflect the same.
   */
  Player.prototype.setCurrentTurn = function(turn){
    this.currentTurn = turn;
    if(turn){
      $('#turn').text('Your turn.');
    }
    else{
      $('#turn').text('Waiting for Opponent');
    }
  }

  // lots of getters

  Player.prototype.getPlayerName = function(){
    return this.name;
  }

  Player.prototype.getPlayerType = function(){
    return this.type;
  }

  /**
   * Returns currentTurn to determine if it is the player's turn.
   */
  Player.prototype.getCurrentTurn = function(){
    return this.currentTurn;
  }
  // GAME OBJECT

  /**
   * Game class
   */
  var Game = function(roomId){
    this.roomId = roomId;
    this.board = [];
    this.moves = 0;

    this.pions_X = 12;
    this.pions_O = 12;

    if (this.moves == 24){
      document.getElementById("button_22").disabled = false;

    }
  }


  /**

Create the Game board by attaching event listeners to the buttons.
   */

   Game.prototype.createGameBoard = function(event){

   document.getElementById("button_22").disabled = true;

    for(var i=0; i<5; i++) {
      this.board.push(['','','','','']);

      for(var j=0; j<5; j++) {
        var t=0;
        //remember this code when trying to link button number
          $('#button_' + i + '' + j).on('click', function(){

          if(!player.getCurrentTurn()){
            alert('Its not your turn!');
            return;
          }

          if($(this).prop('disabled'))
            alert('This tile has already been played on!');

          var row = parseInt(this.id.split('_')[1][0]);
          var col = parseInt(this.id.split('_')[1][1]);

          //Update board after your turn.
          game.playTurn(this);
          game.updateBoard(player.getPlayerType(), row, col, this.id);
          t++;

          game.board[row][col] = player.getPlayerType();
            if(t==2){
              player.setCurrentTurn(false);
              t=0;
            }

          if (player.getPlayerType()== "O" && game.moves == 24){
             document.dispatchEvent(event);
             console.log("the final move of phase 1 has been played!");
             phase1_starter();
                  }

            // hiding this because well replace it with socket emit

          player.updateMovesPlayed(1 << (row * 3 + col));
        //  game.checkWinner();
          return false;
        }); //on click ends
      }
    } // for loop ends

    return true;
  }

  Game.prototype.phase2 = function(){
    //
    var sourceturn = true;
    var source;var target;
    var moveTime = false;

    document.getElementById("btn_22").disabled = false;

    $('#phase').text('This is phase two');
    var x = document.getElementsByClassName("tile");

    for (var i = 0; i < x.length; i++) {
        x[i].disabled = false;
      }
    var source; var target;

    for(var i=0; i<5; i++) {
          for(var j=0; j<5; j++) {
            temp = '#btn_'+i+j;
            //  console.log($(temp))

              $(temp).on('click', function(){
                console.log(this.id)
                if (sourceturn == true) {
                   source = this.id;
                   this.style.borderColor = "red";
                  sourceturn = false;
                }else
                  { target = this.id;
                    this.style.borderColor = "blue";

                  var rowS = parseInt(source.split('_')[1][0]);
                  var colS = parseInt(source.split('_')[1][1]);

                  var rowT = parseInt(target.split('_')[1][0]);
                  var colT = parseInt(target.split('_')[1][1]);

                  if (game.makeAmove(source, target)) {
                    if (game.legalMove(source, target)) {
                      document.getElementById(target).innerHTML = document.getElementById(source).innerHTML;
                      document.getElementById(source).innerHTML = '';

                      console.log("target : "+target);
                      console.log("source : "+source);
                      game.Phase2_playTurn(source,target);
                      game.phase2_updateBoard(player.getPlayerType(), rowS, colS,source ,false);
                      game.phase2_updateBoard(player.getPlayerType(), rowT, colT,target ,true);

                      player.setCurrentTurn(false);
                      console.log(" the board after local modification" + game.board);

                    }
                    else {
                      alert("move not allowed!");
                    }
                    sourceturn = true;

                    }
                    else {
                      sourceturn = true;
                    }
                    document.getElementById(target).style.borderColor = '#222';
                    document.getElementById(source).style.borderColor = '#222';
                  }

              });
          }
        }
}

// mark 1
Game.prototype.getBoard = function(){
  return game.board;
}

socket.on('winnerIS', function(data){
  game.announceWinner(data.winner);
});

// look here
document.addEventListener('scored', function(){
  console.log("event scoreEvent has been dispatched");
  var obj = { board: game.getBoard(),
              room: game.getRoomId() };
  socket.emit('newScore', obj );
  console.log(obj);

});

Game.prototype.legalMove = function(source,target){

  var scoreEvent = new Event('scored');


  var rowS = parseInt(source.split('_')[1][0]);
  var colS = parseInt(source.split('_')[1][1]);

  var rowT = parseInt(target.split('_')[1][0]);
  var colT = parseInt(target.split('_')[1][1]);

  // must add movement to empty spots
   if ((rowT == rowS + 1 && game.board[rowT][colT] == '') || (rowT == rowS - 1 && game.board[rowT][colT] == '') || (colT == colS - 1 && game.board[rowT][colT] == '') || (colT == colS + 1 && game.board[rowT][colT] == '') ) {

    game.board[rowT][colT] = game.board[rowS][colS];
    game.board[rowS][colS] = '';
    return true;
  }

  else if ((rowT == rowS + 1 && game.board[rowT + 1][colT] == player.getPlayerType()) || (rowT == rowS - 1 && game.board[rowT - 1][colT] == player.getPlayerType()) || (colT == colS - 1 && game.board[rowT][colT - 1] == player.getPlayerType()) || (colT == colS + 1 && game.board[rowT][colT + 1] == player.getPlayerType()) ) {
    console.log(" target surrounded by 2 opponents true");
    game.board[rowT][colT] = game.board[rowS][colS];
    game.board[rowS][colS] = '';
    document.dispatchEvent(scoreEvent);
    return true;
  }

  else {
    alert('Move not allowed');
    return false;
  }
}

Game.prototype.makeAmove = function(source, target)
{
  var rowS = parseInt(source.split('_')[1][0]);
  var colS = parseInt(source.split('_')[1][1]);

  var rowT = parseInt(target.split('_')[1][0]);
  var colT = parseInt(target.split('_')[1][1]);

  // checks if source belongs to you and target belongs to opponent
  if (game.board[rowS][colS] == player.getPlayerType() && game.board[rowT][colT] != player.getPlayerType()) {
    console.log("initial conditions are correct");
    return true;
  }
  else if (game.board[rowS][colS] == player.getPlayerType() && game.board[rowT][colT] == '') {
    console.log("moving into empty lot");
    return true;
  }
  else {
    console.log("initial conditions are false");
    alert("invalid source or taget");
    return false;
  }

}

  /**
   * Remove the menu from DOM, display the gameboard and greet the player.
   */
  Game.prototype.displayBoard = function(message){

    var event = new Event('finished');

    document.addEventListener('finished', function(){
    socket.emit('phase1_end', {room: game.getRoomId() });

    });

    socket.on('phase2_start', function(){
      phase1_starter();
    });

    $('.menu').css('display', 'none');
    $('.gameBoard').css('display', 'block');
    $('#userHello').html(message);

    this.createGameBoard(event);
    }

    let phase1_starter = function(){
      changeID();
      Game.prototype.phase2();
    }

    let changeID = function()
    {
      for(var i =0; i<5;i++){
        for(var j=0; j<5; j++){

          $('#button_' + i + '' + j).off();
          document.getElementById('button_'+i+''+j).id = 'btn_'+i+''+j;

        }
      }

    }

  /**
   * Update game board UI
   */
  Game.prototype.updateBoard = function(type, row, col, tile){
    $('#'+tile).text(type);
    $('#'+tile).prop('disabled', true);
    this.board[row][col] = type;

    this.moves ++;
  }

  Game.prototype.phase2_updateBoard = function(type, row, col, tile, add){

    var opponentType = player.getPlayerType() == P1 ? P2 : P1;

    if (add) {
      $('#'+tile).text(type);
      console.log($('#'+tile));
      this.board[row][col] = type;
      console.log(type+" was added to board on [row" + row + "][" + col + "]");
      this.moves ++;
    }else {
      $('#'+tile).text('');
      this.board[row][col] = '';
      this.moves ++;
    }

  }

  Game.prototype.getRoomId = function(){
    return this.roomId;
  }

  /**
   * Send an update to the opponent to update their UI.
   */
  Game.prototype.playTurn = function(tile){
    var clickedTile = $(tile).attr('id');
    var turnObj = {
      tile: clickedTile,
      room: this.getRoomId()
    };
    // Emit an event to update other player that you've played your turn.
    socket.emit('playTurn', turnObj);
  }

  Game.prototype.Phase2_playTurn = function(source, target){
    var clickedSource = source;
    var clickedTarget = target;

    var turnObj = {
      source: clickedSource,
      target: clickedTarget,
      room: this.getRoomId()
    };
    // Emit an event to update other player that you've played your turn.
    socket.emit('Phase2_playTurn', turnObj);
    console.log("emitted to server..");
    console.log(turnObj);
  }

  // Game.prototype.checkWinner = function(){
  //   var currentPlayerPositions = player.getMovesPlayed();
  //   Player.wins.forEach(function(winningPosition){
  //     // We're checking for every winning position if the player has achieved it.
  //     // Keep in mind that we are using a bitwise AND here not a logical one.PlaysArr
  //     if(winningPosition & currentPlayerPositions == winningPosition){
  //       game.announceWinner();
  //     }
  //   });
  //
  //   var tied = this.checkTie();
  //   if(tied){
  //     socket.emit('gameEnded', {room: this.getRoomId(), message: 'Game Tied :('});
  //     alert('Game Tied :(');
  //     location.reload();
  //   }
  // }

  /**
   * Announce the winner if the current client has won.
   * Broadcast this on the room to let the opponent know.
   */
  Game.prototype.announceWinner = function(winner){
    var message = winner + ' wins!';
    socket.emit('gameEnded', {room: this.getRoomId(), message: message});
    alert(message);
    location.reload();
  }

  /**
   * End the game if the other player won.
   */
  Game.prototype.endGame = function(message){
    alert(message);
    location.reload();
  }



  /**
   * New Game created by current client.
   * Update the UI and create new Game var.
   */
  socket.on('newGame', function(data){
    var message = 'Hello, ' + data.name +
      '. Please ask your friend to enter Game ID: ' +
      data.room + '. Waiting for player 2...';

    // Create game for player 1
    game = new Game(data.room);
    game.displayBoard(message);
  });

  /**
   * If player creates the game, he'll be P1(X) and has the first turn.
   * This event is received when opponent connects to the room.
   */
  socket.on('player1', function(data){
    var message = 'Hello, ' + player.getPlayerName();
    $('#userHello').html(message);
    player.setCurrentTurn(true);
  });

  /**
   * Joined the game, so player is P2(O).
   * This event is received when P2 successfully joins the game room.
   */
  socket.on('player2', function(data){
    var message = 'Hello, ' + data.name;

    //Create game for player 2
    game = new Game(data.room);
    game.displayBoard(message);
    player.setCurrentTurn(false);
  });

  /**
   * Opponent played his turn. Update UI.
   * Allow the current player to play now.
   */
  socket.on('turnPlayed', function(data){
    var row = data.tile.split('_')[1][0];
    var col = data.tile.split('_')[1][1];
    var opponentType = player.getPlayerType() == P1 ? P2 : P1;
    game.updateBoard(opponentType, row, col, data.tile);
    player.setCurrentTurn(true);
  });

  socket.on('phase2_turnPlayed', function(data){
    var rowS = data.source.split('_')[1][0];
    var colS = data.source.split('_')[1][1];

    var rowT = data.target.split('_')[1][0];
    var colT = data.target.split('_')[1][1];

    var opponentType = player.getPlayerType() == P1 ? P2 : P1;
    //needs a new version
    game.phase2_updateBoard(opponentType, rowS, colS, data.source, false);
    game.phase2_updateBoard(opponentType, rowT, colT, data.target, true);
    console.log("the board after tunrplayed signal: "+ game.board);
    player.setCurrentTurn(true);
  });

  /**
   * If the other player wins or game is tied, this event is received.
   * Notify the user about either scenario and end the game.
   */
  socket.on('gameEnd', function(data){
    game.endGame(data.message);
    socket.leave(data.room);
  });

  /**
   * End the game on any err event.
   */
  socket.on('err', function(data){
    game.endGame(data.message);
  });

})();
