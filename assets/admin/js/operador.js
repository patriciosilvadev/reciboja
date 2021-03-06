  var tmplt = {
    room: [
      '<li data-roomId="${room}">',
        '<span class="icon"></span> ${room}',
      '</li>'
    ].join(""),
    message: [
      '<div class="itemdiv dialogdiv">',
        '<div class="user">',
          '<img alt="${nome}" src="/assets/admin/avatars/avatar2.png" />',
        '</div>',
        '<div class="body">',
          '<div class="name"><a href="">${nome} </a></div>',
          '<div class="text">${message}</div>',
        '</div>',
      '</div>'
    ].join(""),
    log: [
      '<div>',
        '<p><i>(${tipo})</i> <strong>${nome}:</strong> ${message}</p>',
      '</div>'
    ].join("")
  };
  var historico = new Object()
  var socket = io.connect(socket_url+':8000')
  
  socket.emit('setSocketConn', operador)

  socket.on('ready', function () {
    socket.emit('setOperadorOnline', operador) 
  });

  socket.on('presence', function(data){
    if(data.state == 'online'){
	  addClient(data.client);
	} else if(data.state == 'offline'){
      removeClient(data.client);
	}
  });
	
	socket.on('enviarmensagem', function(data){
      $.tmpl(tmplt.message, {nome: data.client.nome, message: data.message}).appendTo('.dialogs')
      historico[data.client.id_atendimento] += $.tmpl(tmplt.log, {tipo: 'cliente', nome: data.client.nome, message: data.message}).html() 
      $('.content-message').animate({scrollTop: $('.dialogs').height()}, 1000)
	});
	
	function addClient(client){
      historico[client.id_atendimento] = ''
      $.tmpl(tmplt.message, {nome: client.nome, message: client.msg}).appendTo('.dialogs')
      historico[client.id_atendimento] += $.tmpl(tmplt.log, {tipo: 'cliente', nome: client.nome, message: client.msg}).html()
      socket.emit('enviarmensagem', {message: operador.msg, room: operador.id_atendimento})
	}
	
	function removeClient(client){
      $.tmpl(tmplt.message, {nome: client.nome, message: 'Saiu da conversa'}).appendTo('.dialogs')
      historico[client.id_atendimento] += $.tmpl(tmplt.log, {tipo: 'sistema', nome: client.nome, message: 'Saiu da conversa'}).html()
      var post = {'id_atendimento': client.id_atendimento, 'historico': historico[client.id_atendimento]}

      $('.content-message').animate({scrollTop: $('.dialogs').height()}, 1000)
      socket.emit('gravarLog', post)
      socket.emit('unsubscribe', { room: 'sala_'+client.id_atendimento });
      $('.tab-pane').html('<div class="alert alert-info">Atendimento Finalizado</div>')
	}

	$(document).ready(function(){
	  $('body').on('submit', '#enviarMsg', function(e){
	    e.preventDefault()
        var msg = $('[name=message]').val()
        if(msg != ''){
          var id_atendimento = $(this).attr('data-salaid')
          $('[name=message]').val('')
          $.tmpl(tmplt.message, {nome: operador.nome, message: msg}).appendTo('.dialogs')
          socket.emit('enviarmensagem', { message: msg, room: id_atendimento});
          
          historico[id_atendimento] += $.tmpl(tmplt.log, {tipo: 'operador', nome: operador.nome, message: msg}).html()
          $('.content-message').animate({scrollTop: $('.dialogs').height()}, 1000)
        }
	  })
	})


function getEspera(){
    $('#espera').load(base_url+'admin/chat/getPendentes', function(data){
      $('.total_atendimentos').text($(data).length-1)
      setTimeout(function(){
        getEspera()
      }, 2000)
    })
}
$(document).ready(function(){
  getEspera()
  $body = $('body')
  $body.on('click', '#espera li a', function(e){
    e.preventDefault()
    $(this).parent().remove()
    var elm = $(this)
    $.getJSON(elm.attr('href'), function(data){
      $('.tab-content .tab-pane').html(data.html)
      subscribe = operador
      subscribe.id_atendimento = data.id_atendimento
      subscribe.msg = data.mensagem_padrao
      socket.emit('subscribe', subscribe)
    })
  })
})
