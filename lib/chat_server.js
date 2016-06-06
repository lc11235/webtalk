var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var nameUsed = [];
var currentRoom = {};

exports.listen = function (server) {
    io = socketio.listen(server);
    
    io.set('log level', 1);
    
    io.sockets.on('connection', function(socket) {//每个用户连接的处理逻辑
        guestNumber = assignGuestName(socket, guestNumber, nickNames, nameUsed);//用户连接上来的时候给予一个默认的访客名
        
        joinRoom(socket, 'Lobby');//在用户连接上时把他加入默认的聊天室Lobby
        
        handleMessageBroadcasting(socket, nickNames);//处理用户的消息，更名，以及聊天室的创建和变更
        handleNameChangeAttempts(socket, nickNames, nameUsed);//响应用户名称更改的命令
        handleRoomJoining(socket);//响应用户更改聊天室的命令
        
        socket.on('rooms', function(){//用户发出请求时，向其提供已经被占用的聊天室列表
            socket.emit('rooms', io.sockets.manager.rooms);
        });
        
        handleClientDisconnetion(socket, nickNames, nameUsed);//定义用户断开连接后的清除逻辑
    });
};

function assignGuestName(socket, guestNumber, nickNames, nameUsed){//分配昵称
    var name = 'Guest' + guestNumber;//生成新昵称
    nickNames[socket.id] = name;
    socket.emit('nameResult', {//让用户知道他们的昵称
        success: true,
        name: name
    });
    nameUsed.push(name);//存放已经被占用的昵称
    return guestNumber +1;
}

function joinRoom(socket, room){//加入房间
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room: room});//让用户知道他们已经加入了新的房间
    socket.broadcast.to(room).emit('messgae', {
        text: nickNames[socket.id] + ' has used ' + room + '.'
    });
    
    var usersInRoom = io.sockets.clients(room);//确定有哪些用户在这个房间里
    if(usersInRoom.length >1) {
        var usersInRoomSummary = 'Users currently in ' + room + ':';
        for(var index in usersInRoom){
            var userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index >0){
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', {text: usersInRoomSummary});//将房间其其他用户的汇总发送给这个用户
    }
}

function handleNameChangeAttempts(socket, nickNames, nameUsed){
    socket.on('nameAttemot', function(name){//添加nameAttempt事件的监听器
        if(name.indexOf('Guest') == 0){
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest".'
            });
        } else {
            if(nameUsed.indexOf(name) == -1){//如果这个昵称还没有被注册就帮他注册
                var previousName = nickNames[socket.id];
                var previousNameIndex = nameUsed.indexOf(previousName);
                nameUsed.push(name);
                nickNames[socket.id] = name;
                delete nameUsed[previousNameIndex];//删掉之前占用的昵称，让其他用户可以使用
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + ' is now known as ' + name + '.'
                });
            } else {
                socket.emit('nameResult', {//如果昵称被占用则给客户端发送错误信息
                    success: false,
                    message: 'That name is already in use.'
                });
            }
        }
    });
}

function handleMessageBroadcasting(socket, nickNames){
    socket.on('message', function(message){
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
    });
}

function handleRoomJoining(socket){
    socket.on('join', function(room){
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

function handleClientDisconnetion(socket, nickNames, nameUsed) {
    socket.on('disconnect', function(){
        var nameIndex = nameUsed.indexOf(nickNames[socket.id]);
        delete nameUsed[nameIndex];
        delete nickNames[socket.id];
    });
}

