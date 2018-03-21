function init() {

  var serverBaseUrl = document.domain;

  /*
   On client init, try to connect to the socket.IO server.
   Note we don't specify a port since we set up our server
   to run on port 8080
  */
  var socket = io.connect(serverBaseUrl);

  //We'll save our session ID in a variable for later
  var sessionId = '';
  
  // Helper function to update user list
  function updateParticipants(participants)
  {
    $('#participants').html('');
    for(var i = 0; i < participants.length; i++)
    {
      $('#participants').append('&lt;span id="' + participants[i].id + '"&gt;' + 
        participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)':'') + 
        '&lt;br /&gt;&lt;/span&gt;'
      );
    }
  }

  /*
 When the client successfully connects to the server, an
 event "connect" is emitted. Let's get the session ID and
 log it.
  */
  socket.on('connect', function () {
    sessionId = socket.io.engine.id;
    console.log('Connected ' + sessionId);    
  });

  socket.on('newConnection', function(data)
  {
    updateParticipants(data.participants);
  });

  socket.on('userDisconnected', function(data)
  {
    $('#' + data.id).remove();
  });

  socket.on('nameChanged', function(data)
  {
    $('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)':'') + '&lt;br /&gt;');
  });

  socket.on('incomingMessage', function(data)
  {
    var message = data.message;
    var name = data.name;
    $('#message').prepand('&lt;b&gt' + name + '&lt;b&gt;&lt;br /&gt;' + message + '&lt;hr /&gt;');
  });

  socket.on('error', function(reason)
  {
    console.log('Unable to connect to server', reason);
  });

  function sendMessage()
  {
    var outgoingMessage = $('#outgoingMessage').val();
    var name = $('#name').val();
    $.ajax({
      url: '/message',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({message: outgoingMessage, name: name})
    });
  }

  function outgoingMessageKeyDown(event)
  {
    if(event.which == 13)
    {
      event.preventDefault();
      if($('#outgoingMessage').val().trim().length <= 0)
      {
        return;
      }
      sendMessage();
      $('#outgoingMessage').val('');
    }
  }

  function outgoingMessageKeyUp()
  {
    var outgoingMessageValue = $('#outgoingMessage').val();
    $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false: true);
  }

  function nameFocusOut()
  {
    var name = $('#name').val();
    socket.emit('nameChange', {id: sessionId, name:name});
  }

  $('#outgoingMessage').on('keyword', outgoingMessageKeyDown);
  $('#outgoingMessage').on('keyword', outgoingMessageKeyUp);
  $('#name').on('focusout', nameFocusOut);
  $('#send').on('click', sendMessage);
}

$(document).on('ready', init);
