const User = require('./User.js');


module.exports = class ServerGame {
    constructor(server) {    
        this.player1 = null;
        this.player2 = null;
        this.spectators = [];
        this.users = [];
        this.ready = [];
        this.messages = [];
        this.io = require('socket.io')(server);
        //this.io.on('connection', function(socket) { this.onConnection.bind(this, socket)});
        this.io.on('connection', (socket) => { this.onConnection(socket); } );
        
    }
 
    onConnection(socket) {
        socket.on('server:user:pseudo_exists', this.checkPseudo_exists.bind(this,socket));
        socket.on("server:user:deconnected",this.logout.bind(this,socket));
        socket.on('disconnect',this.logout.bind(this,socket));
        socket.on("client:racket:moved",(infos)=>{socket.broadcast.emit("server:racket:moved", infos);});
        socket.on('client:game:ready',this.startGame.bind(this,socket));
        socket.on('client:ball:position',(infos)=>{
            //console.log(`La balle :  ${infos[0]};${infos[1]}`);
            socket.broadcast.emit("server:ball:position",infos);
        });
        socket.on('client:message:send',(message)=>{
            this.sendMessages(socket,[message]);
        });
        socket.on("user:score:send",this.sendSocre.bind(this,socket));
        socket.on("client:game:stop",this.stopGame.bind(this,socket));
    }
 
    checkPseudo_exists(socket,infos){
        let ob = {
            result:true
        };
        for(let user of this.users){
            if(user.pseudo == infos.name){
                ob.result = false;
                break;
            }
        }
        if(ob.result == true){
            let user = new User(socket.id,infos.name);
            if(infos.role == 1){
                if(this.player1 == null){
                    user.role = 1;
                    this.player1 = user;
                }
                else user.role = 3;
            }else if(infos.role == 2){
                if(this.player2 == null){
                    user.role = 2;
                    this.player2 = user;
                }
                else user.role = 3;
            }else{
                user.role = 3;
                this.spectators.push(user);
            }
            this.users.push(user);
            socket.user = user;
            ob.user = user;
            //console.log(`${user.pseudo}:${user.role}`);
        }
        socket.emit('server:user:connect',ob);
    }

    logout(socket,user){
        if(socket != undefined && socket.user != undefined){
            for(let key in this.users){
                if(this.users[key]["pseudo"] == socket.user.pseudo){
                    this.users.splice(key,1);
                    break;
                }
            }
        
            if(socket.user.role == 1)
            {
                this.player1 = null;
                this.stopGame();
            }else if(socket.user.role == 2)
            {
                this.player2 = null;
                this.stopGame();
            }else{
                for(let key in this.spectators){
                    if(this.spectators[key]["pseudo"] == socket.user.pseudo){
                        this.spectators.splice(key,1);
                        break;
                    }
                }
            }
        }
    }

    startGame(socket,role){
        if(!this.ready.includes(role)){
            this.ready.push(role);
            console.log(`Le joueur ${role} est prêt`);
        }
        if(this.ready.length == 2){
            let str = this.player1.pseudo + " : " + this.player2.pseudo;
            this.io.emit("server:game:started",str);
        }
    }
    
    sendMessages(socket,messages){
        this.io.emit("server:messages:send",messages);
    }

    sendSocre(socket,wall){
        if(wall == "left")this.player1.score += 1;
        if(wall == "right")this.player2.score += 1;
        let str = this.player1.score.toString() + " : " + this.player2.score.toString();
        this.io.emit("server:score:send",str);
    }

    stopGame(){
        if(this.player1 != undefined && this.player1 != null)this.player1.score = 0;
        if(this.player2 != undefined && this.player2 != null)this.player2.score = 0;
        this.ready = [];
        this.io.emit("server:game:end");
    }
}

 
