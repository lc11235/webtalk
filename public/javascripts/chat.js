var Chat = function(socket){
    this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text){//发送聊天消息的函数
    var message = {
        room: room,
        text: text
    };
    this.socket.emit('message', message);  
};

Chat.prototype.changeRoom = function(room){//变更房间的函数
    this.socket.emit('join', {
        newRoom: room
    });  
};

Chat.prototype.processCommand = function(command){//处理聊天指令，包括join用来加入或创建一个房间，nick用来修改昵称
    var words = command.split(' ');
    var command = words[0]
                    .substring(1,words[0].length)
                    .toLowerCase();
    var message = false;
    
    switch(command){
        case 'join':
            words.shift();
            var room = words.join(' ');
            this.changeRoom(room);
            break;
        case 'nick':
            words.shift();
            var name = words.join(' ');
            this.socket.emit('nameAttempt', name);
            break;
        default:
            message = 'Unrecognized command.';
            break;
    }  
    
    return message;
};