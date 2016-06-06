function divEscapedContentElement(message){//处理用户输入，不可信，转义所有输入的字符
    return $('<div></div>').text(message);
}

function divSystemContentElement(message){//可信，直接插入到html代码中
    return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket){
    var message = $('#send-message').val();
    var systemMessage;
    
    if(message.charAt(0) == '/'){//检查用户输入内容，以斜杠开头，将其作为聊天指令
        systemMessage = chatApp.processCommand(message);
        if(systemMessage){
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    } else {
        chatApp.sendMessage($('#room').text(), message);//非命令输入广播给其他用户
        $('#messages').append(divEscapedContentElement(message));
        s('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    
    $('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function(){
    var chatApp = new Chat(socket);
    
    socket.on('nameResult', function(result){//显示更名尝试的结果
        var message;
        
        if(result.success){
            message = 'You are now known as ' + result.name + '.';
        } else {
            message = result.message;
        }
        
        $('#messages').append(divSystemContentElement(message));
    });
    
    socket.on('joinResult', function(result){//显示房间变更结果
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });
    
    socket.on('message', function(message){//显示收到的消息
        var newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });
    
    socket.on('rooms', function(rooms){//显示可用房间列表
        $('#room-list').empty();
        
        for(var room in rooms){
            room = room.substring(1, room.length);
            if(room != ''){
                $('#room-list').append(divEscapedContentElement(room));
            }
        }
        
        $('#room-list div').click(function(){//点击房间名可以换到那个房间中
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-messages').focus();
        });
    });
    
    setInterval(function(){//定期请求可用房间列表
        socket.emit('rooms');
    }, 1000);
    
    $('#send-message').focus();
    
    $('#send-form').submit(function(){//提交表单可以发送聊天消息
        processUserInput(chatApp, socket);
        return false;
    }); 
});