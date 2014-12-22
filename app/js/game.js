var create = function() {
  var game_id = $("#game_id").val();
  $.post('/games', { 'id': game_id });
}

var listen = function() {

  var game_id = $("#game_id").val();

  var es = new EventSource('/games/' + game_id + '/stream?uid=' + $('#uid').val() );

  es.onmessage = function(event) {
    var msg = event.data;
    $('#notifications').append(msg + '<br />');
  }

}

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

    // alert(parsed.board);
    // $('#notifications').append('Board: ' + parsed.board + '<br />');
    //
    for (i in board_ary) {
      $('#notifications').append(board_ary[i] + '<br />');
    }
  });
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

  $.ajax({
    type: 'PATCH',
    url: '/games/' + game_id,
    data: { 'uid': uid, 'msg-type': 'move', 'a1': a1, 'a2': a2, 'b1': b1, 'b2': b2  }
  });
}
