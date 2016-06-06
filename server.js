var http = require("http");

var fs = require("fs");

var path = require("path");

var mime = require("mime");

var cache = {};

function send404(response) {
    response.writeHead(404, {"Content-Type": "text/plain"});
    response.write("Error 404: resource not found.");
    response.end();
}

function sendFile(response, filePath, fileContents){
    response.writeHead(200, {"Content-Type": mime.lookup(path.basename(filePath))});
    response.end(fileContents);
}

function serverStatic(response, cache, absPath){
    if(cache[absPath]){ //检查文件是否缓存在内存中
        sendFile(response, absPath, cache[absPath]);    //从内存中中返回文件
    } else {
        fs.exists(absPath, function(exists) {
           if(exists){
               fs.readFile(absPath, function (err, data) {
                   if(err){
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

var server = http.createServer(function(requset, response){
    var filePath = false ;
    
    if(requset.url == '/'){
        filePath = 'public/index.html';
    } else {
        filePath = 'public' + requset.url;
    }
    
    var absPath = './' + filePath;
    serverStatic(response, cache, absPath);
});

server.listen(8888, function(){
    console.log("Server listening on port 8888."); 
});