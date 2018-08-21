var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require("path");

var port = 3000;
http.listen(port, function() {
	console.log('Server running on port ' + port);
});

app.use(express.static(__dirname + '/dist/client'));

app.get('/', function(req, res) {
    console.log(__dirname);
    res.sendFile(path.join(__dirname + '/dist/client/index.html'));
});


var allClients = {};
io.on('connection', function (socket) {
    emitClientSelf(allClients, socket);
    socket.on('recieveUserName', function(data){
        allClients[socket.id] = data;
        socket.broadcast.emit('users', allClients);
    });
	socket.on('draw', function (data) {
        socket.broadcast.emit('draw', data);
    });
    socket.on('logout', function () {
        console.log("logout");
        delete allClients[socket.id];
        emitClientSelf(allClients, socket);
        socket.broadcast.emit('users', allClients);
    });
    socket.on('disconnect', function (data) {
        console.log("disconnect");
        delete allClients[socket.id];
        emitClientSelf(allClients, socket);
        socket.broadcast.emit('users', allClients);
    });
});

function emitClientSelf(client, socket) {
    delete client[socket.id];
    socket.emit('users', client);
}