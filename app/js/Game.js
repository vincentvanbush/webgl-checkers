var CHECKERS = {
    WHITE: 'w',
    BLACK: 'b'
};

var game_id = $("#game_id").val();
var uid = $("#uid").val();

$(document).ready(function() {

});

var foo = function() { alert("Foo"); };

var myColor;

var sendSit = function(color) {
  $.ajax({
    type: 'PATCH',
    url: '/games/' + game_id,
    data: { 'uid': uid, 'msg-type': 'sit', 'color': color },
    statusCode: {
      200: function (response) { myColor = color },
      403: function (response) { alert (response.responseText) }
    }
  });
};

var sendUnsit = function() {
  $.ajax({
    type: 'PATCH',
    url: '/games/' + game_id,
    data: { 'uid': uid, 'msg-type': 'unsit' },
    statusCode: {
      200: function (response) { myColor = 0 },
      403: function (response) { alert (response.responseText) }
    }
  });
};

var sendMove = function(a1, a2, b1, b2, callback1, callback2) {
  $.ajax({
    type: 'PATCH',
    url: '/games/' + game_id,
    data: { 'uid': uid, 'msg-type': 'move', 'a1': a1, 'a2': a2, 'b1': b1, 'b2': b2  },
    statusCode: {
      200: function (response) { callback1() },
      403: function (response) { callback2(); alert (response.responseText) }
    }
  });
};

var requestGameState = function(callback) {
  st = $.get('/games/' + game_id + '/state', {} );
  st.done(function (data) {
    parsed = JSON.parse(data);
    callback(parsed);
  });
};

CHECKERS.Game = function (options) {
    'use strict';

    var colorTurn = CHECKERS.WHITE;

    var es = new EventSource('/games/' + game_id + '/stream?uid=' + uid );
    console.log ('Stream created: ' + '/games/' + game_id + '/stream?uid=' + uid );

    es.onmessage = function(event) {
      console.log ("Received message: " + event.data);
      var parsed = JSON.parse (event.data);

      switch (parsed['msg-type']) {
        case 'move':
          if (parsed['uid'] === uid) break;
          colorTurn = parsed['turn'];
          var from = [ parseInt(parsed['a1']), parseInt(parsed['a2']) ];
          var to = [ parseInt(parsed['b1']), parseInt(parsed['b2']) ];
          animatePiece(from, to);
          break;
        }
      };

    options = options || {};

    var boardController = null;

    var board = [
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '']
    ];


    function init() {
        boardController = new CHECKERS.BoardController({
            containerEl: options.containerEl,
            assetsUrl: options.assetsUrl,
            callbacks: {
                pieceCanDrop: validateMove,
                pieceDropped: pieceMoved,
                send: sendMove
            }
        });

        boardController.drawBoard(onBoardReady);
    }

    function onBoardReady() {
	    var row, col, piece;

      requestGameState(function (parsedData) {
        var board_ary = JSON.parse (parsedData.board);
        colorTurn = parsedData.turn;
        for (row = 0; row < board.length; row++) {
          for (col = 0; col < board[row].length; col++) {
            if (board_ary[row][col] === 'b') { // black piece
              piece = {
                color: CHECKERS.BLACK,
                pos: [row, col]
              };
            } else if (board_ary[row][col] === 'w') { // white piece
              piece = {
                color: CHECKERS.WHITE,
                pos: [row, col]
              };
            } else { // empty square
              piece = 0;
            }

            board[row][col] = piece;

            if (piece) {
              boardController.addPiece(piece);
            }
          }
        }
      });
	}

    function validateMove(from, to, color) {
        if (color !== colorTurn) {
            return false;
        }

        var fromRow = from[0];
        var fromCol = from[1];
        var toRow = to[0];
        var toCol = to[1];

        if (myColor[0] != colorTurn) {
          return false;
        }

        if (board[toRow][toCol] !== 0) {
          return false;
        }
        return true;
    }

    function animatePiece(from, to) {
      boardController.startAnimatingPiece(from, to);
    }

    function pieceMoved(from, to) {
        var fromRow = from[0];
        var fromCol = from[1];
        var toRow = to[0];
        var toCol = to[1];
        board[toRow][toCol] = board[fromRow][fromCol];
        board[fromRow][fromCol] = 0;
        if (toRow === fromRow - 2) {
            if (toCol === fromCol - 2) {
                boardController.removePiece(fromRow - 1, fromCol - 1);
                board[fromRow - 1][fromCol - 1] = 0;
            } else {
                boardController.removePiece(fromRow - 1, fromCol + 1);
                board[fromRow - 1][fromCol + 1] = 0;
            }
        } else if (toRow === fromRow + 2) {
            if (toCol === fromCol + 2) {
                boardController.removePiece(fromRow + 1, fromCol + 1);
                board[fromRow + 1][fromCol + 1] = 0;
            } else {
                boardController.removePiece(fromRow + 1, fromCol - 1);
                board[fromRow + 1][fromCol - 1] = 0;
            }
        }
    }

    init();
};
