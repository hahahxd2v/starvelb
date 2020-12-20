
const request = require("request");
const WebSocket = require("ws");
const url = "https://raw.githubusercontent.com/KokoJambo11/starvelb/main/serversdata.json?token=APB533RCY5LKIC654M7K5J2737FMM";
let starve_server_data = {};

class ServerStorage{
    constructor(name, ip, port, ssl, players = 0){
        this.players = players;
        this.leaderboard = null;
        this.name = name;
        this.ip = ip;
        this.port = port;
        this.ssl = ssl;
    }
}

function parse_server_data(data, callback){
    const server_data = data.body;
    starve_server_data = {};
    for(let i = 0; i < server_data.length; i++){
        let server = (server_data[i]);
        if(server.i.match(/server-[a-z0-9]+\.starve.io/)){
            const name = server.a;
            const ip = server.i;
            const port = server.p;
            const players = server.nu;
            const ssl = server.ssl;
            starve_server_data[name] = new ServerStorage(name, ip, port, ssl, players);
        }
    }
    StarveScrape(callback);
}

function refresh_server_data(callback){
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            parse_server_data(response, callback);
        }
    });
}

function get_IP_validator(){
    return [26, 218, 11, 7, 190, 212, 232, 89, 215, 200, 155, 219, 18, 16, 217, 64, 200, 171, 129];
};

function get_TOKEN_validator(){
    return [12, 67, 89, 202, 21, 29, 178, 90, 10, 23, 89, 120, 2, 231, 152, 121, 43, 74, 23, 46, 152, 176, 23, 65, 89, 76];
};

function random_string(length){
    var str = "";
    for (var i = 0; i < length; i++) {
      str += String.fromCharCode(48 + Math.floor(74 * Math.random()));
    }
    return str
}

function buildPTR2(TOKEN_TEMPLATE, validator){
    var generatedToken = '';
    for (var i = 0; i < validator.length; i++) {
        generatedToken += String.fromCharCode(validator[i] ^ TOKEN_TEMPLATE[i + 1]);
    }
    return random_string(14).substring(0, 6) + generatedToken.substring(6);
};


let toRetreive = [];
function LeaderboardRetriever(name, ip, port, ssl){
    this.ip = ip;
    this.port = port;
    this.ssl = ssl
    this.ws = null;
    this.name = name;
    this.connect();
}

LeaderboardRetriever.prototype.connect = function(){
    this.ws = new WebSocket(`${this.ssl ? "wss" : "ws"}://${this.ip}:${this.port}`)
    console.log(`${this.ssl ? "wss" : "ws"}://${this.ip}:${this.port}`)
    this.ws.on("error", ()=>{console.log("err")})
    this.ws.on("open", ()=>{this.open()});
    this.ws.on("close", ()=>{console.log("Terminated con")});
    this.ws.on("message", (e)=>{this.message(e)});
}


LeaderboardRetriever.prototype.handshake = function(){
    console.log("Handshaking");
    const HAND_SHAKE = [
        this.name,
        1440,
        1440,
        52,
        buildPTR2(
            get_TOKEN_validator(), 
            get_IP_validator(),
        ),
        "",
        0,
        1,
        2,
        0,
        0,
        1,
        0,
        0,
        0,
        null
    ];

    this.ws.send(JSON.stringify(HAND_SHAKE));
}

LeaderboardRetriever.prototype.open = function(){
    console.log("Opened conenction")
    this.handshake();
}


LeaderboardRetriever.prototype.destroy = function(){
    for(let i = 0 ; i < toRetreive.length; i++){
        if(toRetreive[i] === this){
            toRetreive.splice(i, 1);
        }
    }
    this.ws.close();
}

LeaderboardRetriever.prototype.message = function(e){
    try{
        if(typeof(e) === "string"){
            starve_server_data[this.name].leaderboard = JSON.parse(e)[4].sort((a,b)=>b.p - a.p);
        }
        this.destroy();
    }catch(e){
        this.destroy()
    };
}


async function StarveScrape(callback){
    for(let name in starve_server_data){
        const server = starve_server_data[name];
        toRetreive.push(new LeaderboardRetriever(server.name, server.ip, server.port, server.ssl));
    }

    setTimeout(()=>{
        console.log(`Missed ${toRetreive.length} servers!`);
        for(let i = 0; i < toRetreive.length; i++){
            toRetreive[i].ws.close();
        }
        toRetreive = [];
        callback(starve_server_data);
    }, 5000);
}

module.exports = {
    StarveScrape: StarveScrape,
    refresh_server_data: refresh_server_data
};