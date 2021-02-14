module.exports = class User {
    
    constructor(socketId, pseudo) {  
        this.id = socketId;
        this.pseudo = pseudo;   
        this.channel;
        this.typing = false;
        this.role = 0;//1->player 1, 2->player2,3->the viewers
        this.score = 0;
    }
}
