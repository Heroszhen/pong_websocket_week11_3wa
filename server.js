const express = require('express');
const app = express();
const path = require('path');
const routes = require('./app/routes.js');
//const server = require('http').createServer(app);
const ServerGame = require('./app/ServerGame.js');

const port =  process.env.PORT || 9000;


app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'pug');

app.use('/',routes);

const server = app.listen(port, () => {
    console.log(`Le serveur est en écoute à l'adresse : http://localhost:${port}`);
});

new ServerGame(server);
