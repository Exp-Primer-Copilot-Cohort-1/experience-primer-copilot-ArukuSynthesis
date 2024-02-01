//Create web server
var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var comments = require('./comments');
var mime = require('mime');
var cache = {};

//Create server
var server = http.createServer(function(request, response) {
    var filePath = false;
    if (request.url == '/') {
        filePath = 'public/index.html';
    } else {
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    serveStatic(response, cache, absPath);
});

//Start server
server.listen(3000, function() {
    console.log("Server listening on port 3000.");
});

//Socket.io
var io = require('socket.io').listen(server);

//Handle user connection
io.sockets.on('connection', function(socket) {
    //Handle user disconnection
    socket.on('disconnect', function() {
        console.log('User disconnected');
    });
    //Handle user message
    socket.on('message', function(message) {
        console.log('User message: ' + message);
        socket.broadcast.emit('message', message);
    });
    //Handle user name
    socket.on('name', function(name) {
        console.log('User name: ' + name);
        socket.set('name', name, function() {
            socket.broadcast.emit('name', name);
        });
    });
    //Handle user comment
    socket.on('comment', function(comment) {
        console.log('User comment: ' + comment);
        comments.add(comment);
        socket.broadcast.emit('comment', comment);
    });
});

//Handle static file serving
function serveStatic(response, cache, absPath) {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath]);
    } else {
        fs.exists(absPath, function(exists) {
            if (exists) {
                fs.readFile(absPath, function(err, data) {
                    if (err) {
                        send404(response);
                    } else {
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }
                });
            } else {
                send404(response);
            }
        });
    }
}

//Handle 404 error
function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}

//Handle file data
function sendFile(response, filePath, fileContents) {
    response.writeHead(200, {'Content-Type': mime.lookup(path.basename(filePath))});
    response.end(fileContents);
}

//Handle comments
function handleComments() {
    var comments = require('./comments');
    var comment = comments.get();
    console.log(comment);
}

//Set interval to handle comments
setInterval(handleComments, 1000);
```
comments.js
```
// Path: comments.js
//Create comments module
var comments = [];

//Add comment
exports.add = function(comment) {
    comments.push(comment);
};

//Get comments
exports.get = function() {
    return comments;
};
