module.exports = function(io) {
    var fs = require('fs');

    var usernames = {};

    function check_key(v) {
        var val = '';

        for (var key in usernames) {
            if (usernames[key]['socketID'] == v)
                val = key;
        }
        return val;
    }

    io.sockets.on('connection', function(socket) {

        // when the client emits 'sendchat', this listens and executes
        socket.on('sendchat', function(data) {
            // we tell the client to execute 'updatechat' with 2 parameters
            io.sockets.emit('updatechat', socket.username, data);
        });

        // when the client emits 'adduser', this listens and executes
        socket.on('adduser', function(user) {
            // we store the username in the socket session for this client
            socket.username = user;
            // add the client's username to the global list
            var userID =user.profileID;
            usernames[userID] = {
                socketID: socket.id,
                user: user
            };
            console.log(usernames)
                // echo to client they've connected
                // socket.emit('updatechat', 'SERVER', 'you have connected');
                // echo to client their username
            socket.emit('store_username', user);
            // echo globally (all clients) that a person has connected
            socket.broadcast.emit('updatechat', user, socket.id);
            // update the list of users in chat, client-side
            io.sockets.emit('updateusers', usernames);
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', function() {
            // remove the username from global usernames list
            delete usernames[socket.username.profileID];
            // update list of users in chat, client-side
            io.sockets.emit('updateusers', usernames);
            // echo globally that this client has left
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        });

        // when the user sends a private msg to a user id, first find the username
        socket.on('check_user', function(asker, id) {
            // id=socket id
            //console.log("SEE: "+asker); console.log(id);
            io.sockets.socket(usernames[asker]['socketID']).emit('msg_user_found', check_key(id));
        });

        // when the user sends a private message to a user.. perform this
        socket.on('msg_user', function(usr, username, msg) {
            //console.log("From user: "+username);
            //console.log("To user: "+usr);            
            // console.log("=======================",usernames);
            io.sockets.socket(usernames[usr]['socketID']).emit('msg_user_handle', username, msg);

            fs.writeFile("chat_data.txt", msg, function(err) {
                if (err) {
                    console.log(err);
                }
                /*else {
                           console.log("The file was saved!");
                           }*/
            });
        });
    });
};