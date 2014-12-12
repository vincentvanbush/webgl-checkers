$(function() {
  $('#send').click(function(event) {
    event.preventDefault();

    var notification = {message: $('#message').val()};
    var connection = $('#connection').val();

    $.post( '/push/' + connection, notification,'json');
  })
});
