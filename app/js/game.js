var state = function() {
  var game_id = $("#game_id").val();
  st = $.get( '/games/' + game_id + '/state', {} );
  st.done( function (data) {
    $('#notifications').append('State: ' + data + '<br />');
  });
}

var board = function() {
  var game_id = $("#game_id").val();
  st = $.get( '/games/' + game_id + '/state', {} );
  st.done( function (data) {
    parsed = JSON.parse(data);
    board_ary = JSON.parse(parsed.board);

    for (i in board_ary) {
      $('#notifications').append(board_ary[i] + '<br />');
    }
  });
  alert(getBoard(game_id));
}

var sit = function() {
  var game_id = $("#game_id").val();
  var uid = $("#uid").val();
  var color = $("#sit_color").val();
  $.ajax({
    type: 'PATCH',
    url: '/games/' + game_id,
    data: { 'uid': uid, 'msg-type': 'sit', 'color': color }
  });
}

var unsit = function() {
  var game_id = $("#game_id").val();
  var uid = $("#uid").val();
  $.ajax({
    type: 'PATCH',
    url: '/games/' + game_id,
    data: { 'uid': uid, 'msg-type': 'unsit' }
  });
}

var move = function() {
  var game_id = $("#game_id").val();
  var uid = $("#uid").val();
  var a1 = $("#a1").val();
  var a2 = $("#a2").val();
  var b1 = $("#b1").val();
  var b2 = $("#b2").val();

  var req = $.ajax({
    type: 'PATCH',
    url: '/games/' + game_id,
    data: { 'uid': uid, 'msg-type': 'move', 'a1': a1, 'a2': a2, 'b1': b1, 'b2': b2  },
    statusCode: {
      403: function (response) { alert (response.responseText) }
    }
  });
}

var getStream = function(game_id, uid) {
  return new EventSource('/games/' + game_id + '/stream?uid=' + uid );
}

var ajaxBoard = function(game_id, callback) {
  st = $.get( '/games/' + game_id + '/state', {} );
  st.done( function (data) {
    parsed = JSON.parse(data);
    board_ary = JSON.parse(parsed.board);
    callback(board_ary);
  });
}

var displayBoard = function(board_ary) {
  $('#board').empty();
  for (i in board_ary) {
    $('#board').append(board_ary[i] + '<br />');
  }
}

$(document).ready(function () {
  var game_id = $("#game_id").val();
  var uid = $("#uid").val();
  // Initialize stream
  var es = getStream( game_id, uid );

  // Attach onMessage event to the stream
  es.onmessage = function (event) {
    console.log("RECEIVED NOTIFICATION " + event.data);
    var parsed = JSON.parse(event.data);

    switch (parsed['msg-type']) {
      case 'sit':
        var color = parsed['color'];
        $('#notifications').append('a player sits as ' + color + '<br />');
      break;

      case 'unsit':
        $('#notifications').append('a player unsits ' + '<br />');
      break;

      case 'move':
        ajaxBoard( game_id, displayBoard );
      break;
    }

    $('#notifications').append(event.data + '<br />');

  }
});
