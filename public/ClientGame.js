export default class ClientGame {
    constructor() {
        this.socket = io.connect(document.location.host);
        //this.socket = io();
        this.me = {};
        this.angle = 0;
        this.canvase = null;
        this.context = null;
        this.racket1 = null;
        this.racket2 = null;
        this.y1 = 210;
        this.y2 = 210;
        this.ball = null;
        this.ball_x = 275;
        this.ball_y = 240;
        this.ball_x2 = 0;
        this.ball_y2 = 0;
        this.cx = 1;
        this.cy = 1;
        this.v = 20;
        this.from = "left";
        this.started = true;
        this.timer = null;
        this.music = null;
        
        this.setCanvas();
        this.listenServer();
        this.transmitUiServer();
    }
  
    listenServer() { 
        this.socket.on('server:user:connect',this.setConnection.bind(this));
        this.socket.on("server:racket:moved", this.setRacket.bind(this));
        this.socket.on("server:game:started",this.startGame.bind(this));
        this.socket.on("server:ball:position",this.setBall_position.bind(this));
        this.socket.on("server:messages:send",this.listMessages.bind(this));
        this.socket.on("server:score:send",this.setScore.bind(this));
        this.socket.on("server:game:end",this.stopGame.bind(this));
    }
 
    transmitUiServer() {
        document.querySelector("#part1 form").addEventListener('submit', (e)=>{
            e.preventDefault();
            e.stopPropagation();
            let name = document.getElementById("inputname").value;
            let role = document.getElementById("selectrole").value;
            this.sendRole(name,role);
        });

        document.getElementById("btn_logout").addEventListener("click",()=>{this.logout();});

        window.addEventListener("DOMContentLoaded",()=>{this.logout(0);});
        window.addEventListener("beforeunload", ()=>{this.logout(0);});

        document.querySelector("#choices #turn").addEventListener("click",()=>{
            this.angle += 90;
            this.canvas.style.transform = "rotate("+this.angle+"deg)";
        });

        window.addEventListener("keydown", (e)=>{
            let code = e.keyCode;
            if(this.started == true && (code == 38 || code == 40 || code == 37 || code == 39)){
                let y = 0;
                if(code == 38 || code == 37){
                    if(this.me.role == 1)y = this.y1 - 50;
                    if(this.me.role == 2)y = this.y2 - 50; 
                }
                if(code == 40 || code == 39){
                    if(this.me.role == 1)y = this.y1 + 50;
                    if(this.me.role == 2)y = this.y2 + 50; 
                }
                window.requestAnimationFrame(this.moveRacket.bind(this,y));
                this.socket.emit('client:racket:moved',{role:this.me.role,y:y});
            }
        });

        document.getElementById("btn_ready").addEventListener("click", ()=>{
            this.socket.emit('client:game:ready',this.me.role);
        });

        document.querySelector("#inputmessage").addEventListener("keydown", (e)=>{this.sendMessage(e);});
        document.getElementById("btn_arret").addEventListener("click", ()=>{
            this.socket.emit('client:game:stop');
        });
        document.getElementById("btn_music").addEventListener("click", ()=>{
            if(this.music == null)this.playMusic();
            else this.stopMusic();
        });
    }
    
    sendRole(name,role){
        document.querySelector("#part1 .alert-danger").classList.add("d-none");
        let ob = {
            name:name,
            role:role
        }
        this.socket.emit("server:user:pseudo_exists",ob);
    }

    setConnection(infos){
        if(infos.result == false){
            document.querySelector("#part1 .alert-danger").innerHTML = "Choisissez un autre nom";
            document.querySelector("#part1 .alert-danger").classList.remove("d-none");
        }else{
            this.me = infos.user;
            localStorage.setItem('user', JSON.stringify(this.me));
            let str = this.me.pseudo;
            if(this.me.role == 1)str += " : joueur 1";
            else if(this.me.role == 2)str += " : joueur 2";
            else str += " : spectateur";
            if(this.me.role != 3){
                document.getElementById("btn_ready").classList.remove("d-none");
                document.getElementById("btn_arret").classList.remove("d-none");
            }
            document.getElementById("me").innerHTML = str;
            document.querySelector("#part1").classList.add("d-none");
            document.querySelector("#part2").classList.remove("d-none");
            this.playMusic();
        }
    }

    logout(n=null){
        if(n != 0){
            let ob = JSON.parse(localStorage.getItem("user"));
            this.socket.emit("server:user:deconnected",ob);
        }
        document.querySelector("#part1").classList.remove("d-none");
        document.querySelector("#part2").classList.add("d-none");
        localStorage.removeItem("user");
        document.querySelector("#allmessages").innerHTML = "";
    }

    setCanvas(){
        this.canvas = document.getElementById('canvas');
        if(this.context != null)this.context.clearRect(0,0,this.canvas.width, this.canvas.height);
        this.context = this.canvas.getContext("2d");
        this.context.fillStyle = 'green';
        this.context.fillRect(10, this.y1, 10, 100);

        this.context.fillStyle = 'yellow';
        this.context.fillRect(530, this.y2, 10, 100);

         //https://stackoverflow.com/questions/25095548/how-to-draw-a-circle-in-html5-canvas-using-javascript
         this.context.beginPath();
         if(this.context == null){
            this.ball_x = this.canvas.width / 2;
            this.ball_y = this.canvas.height / 2;
         }
         this.context.arc(this.ball_x,this.ball_y, 10, 0, 2 * Math.PI);
         this.context.fillStyle = 'white';
         this.context.fill();
         this.context.stroke();
        
    }

    moveRacket(y){
        if(y < 0)y = 0;
        if(y + 100 > 480)y=380;
        if(this.me.role == 1){
            this.y1 = y;this.setCanvas();
        }
        if(this.me.role == 2){
            this.y2 = y;this.setCanvas();
        }
    }
     
    setRacket(infos){
        let y = infos.y;
        if(y < 0)y = 0;
        if(y + 100 > 480)y=380;
        if(infos.role == 1){
            this.y1 = y;this.setCanvas();
        }
        if(infos.role == 2){
            this.y2 = y;this.setCanvas();
        }
    }
    

    startGame(str){
        console.log("La partie commence")
        document.getElementById("btn_ready").classList.add("d-none");
        document.getElementById("players").innerHTML = str;
        if(this.me.role == 1){
            this.timer = setInterval(()=>{ 
                this.ball_move();
            }, 20);
        }  
    }

    ball_move(){
        this.detecteCollision();
        this.ball_x += this.cx * 5;
        this.ball_y += this.cy * 5;
        this.setCanvas();
        if(this.me.role == 1)this.socket.emit('client:ball:position',[this.ball_x,this.ball_y]);
    }
    detecteCollision(){
        
        //walls bottom
        if(this.ball_y + 10 >= this.canvas.height){
           
            if(this.from == "left" || (this.from == "top" && this.ball_x2 <= this.canvas.width/2)){
                this.cx = 1;
                this.cy = -1; 
            }else{
                this.cx = -1;
                this.cy = -1;
            }
            this.from = "bottom";
            this.ball_x2 = this.ball_x;
            this.ball_y2 = this.ball_y + 10;
            this.playSons();
        }
        //top
        if(this.ball_y - 10 <= 0){
            
            if(this.from == "right" || (this.from == "bottom" && this.ball_x2 >= this.canvas.width/2)){
                this.cx = -1;
                this.cy = 1;
            }else{
                this.cx = 1;
                this.cy = 1;
            }
            this.from == "top";
            this.ball_x2 = this.ball_x ;
            this.ball_y2 = this.ball_y - 10;
            this.playSons();
        }
        
        //rocket-left
        let x = this.ball_x - 10;
        let y = this.ball_y;
        if(x <= 20 && (y >= this.y1 && y <= this.y1 + 100)){
            if(this.from == "top" || (this.from == "right" && this.ball_y2 <= this.canvas.height/2)){
                this.cx = +1;
                this.cy = +1;  
            }else{
                this.cx = +1;
                this.cy = -1;  
            }
            this.from = "left";
            this.ball_x2 = this.ball_x - 10;
            this.ball_y2 = this.ball_y;
            this.playSons();
            return ;
        }
        //rocket-right
        x = this.ball_x + 10;
        y = this.ball_y;
        if(x >= 530 && (y >= this.y2 && y <= this.y2 + 100)){
            if(this.from == "bottom" || (this.from == "left" && this.ball_y2 >= this.canvas.height/2)){
                this.cx = -1;
                this.cy = -1;
            }else{
                this.cx = -1;
                this.cy = 1;
            }
            this.from = "right";
            this.ball_x2 = this.ball_x + 10;
            this.ball_y2 = this.ball_y;
            this.playSons();
            return;
        }


        //right
        if(this.ball_x + 10 >= this.canvas.width){
            if(this.from == "bottom" || (this.from == "left" && this.ball_y2 >= this.canvas.height/2)){
                this.cx = -1;
                this.cy = -1;
            }else{
                this.cx = -1;
                this.cy = 1;
            }
            this.from = "right";
            this.ball_x2 = this.ball_x + 10;
            this.ball_y2 = this.ball_y;
            this.socket.emit("user:score:send","left");
            this.playSons();
        }
        //left
        if(this.ball_x - 10 <= 0){
            if(this.from == "top" || (this.from == "right" && this.ball_y2 <= this.canvas.height/2)){
                this.cx = +1;
                this.cy = +1;  
            }else{
                this.cx = +1;
                this.cy = -1;  
            }
            this.from = "left";
            this.ball_x2 = this.ball_x - 10;
            this.ball_y2 = this.ball_y;
            this.socket.emit("user:score:send","right");
            this.playSons();
        } 
    }

    setBall_position(infos){
        this.ball_x = infos[0];
        this.ball_y = infos[1];
        this.setCanvas();
    }

    sendMessage(e){
        if(e.keyCode == 13){
            let message = e.target.value;
            if(message != ""){
                let ob = {
                    user:this.me.pseudo,
                    message:message
                }
                this.socket.emit('client:message:send',ob);
                document.querySelector("#inputmessage").value = "";
            }
        }
    }

    listMessages(messages){
        if ("content" in document.createElement("template")) {
            let template = document.querySelector("#messagesTpl");
            for(let entry of messages){
                let clone = document.importNode(template.content, true);
                clone.querySelector("span.author").innerHTML = entry.user;
                clone.querySelector("span.message").innerHTML = entry.message;
                document.querySelector("#allmessages").appendChild(clone);
            }
        }
    }

    setScore(str){
        document.querySelector("#score").innerHTML = str;
    }

    stopGame(){
        clearInterval(this.timer);
        this.y1 = 210;
        this.y2 = 210;
        this.ball_x = 275;
        this.ball_y = 240;
        this.ball_x2 = 0;
        this.ball_y2 = 0;
        this.cx = 1;
        this.cy = 1;
        this.setCanvas();
        document.querySelector("#score").innerHTML = "";
        if(this.me.role != 3){
            document.getElementById("btn_ready").classList.remove("d-none");
            document.getElementById("btn_arret").classList.remove("d-none");
        }
    }

    playSons(){
        var audio = new Audio('./files/ball.wav');
        audio.play();
    }

    playMusic(){
        this.music = new Audio('./files/Voices_Patrick Patrikios.mp3');
        this.music.loop = true;
        this.music.play();
    }

    stopMusic(){
        this.music.pause();
        this.music = null;
    }
}

