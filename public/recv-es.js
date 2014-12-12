$(function() {

  $("#container").notify({
    speed: 500,
    expires: false
  });

  var connection = prompt("Enter connection ID");

  var es = new EventSource('/stream/' + connection);
  es.onmessage = function(e) {
    var msg = $.parseJSON(event.data);
    $("#container").notify("create", {
      title: msg.timestamp,
      text: msg.message
    });
  }
})
