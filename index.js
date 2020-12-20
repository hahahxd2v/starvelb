const Discord = require("discord.js");
const {refresh_server_data} = require("./starve_scraper");
const leader_board = [];


function high_score(data){

    let highest = {name: null, score: null, server: null};
    for(let name in data){


        const server = data[name].leaderboard;
        if(!server) return;

        for(let i = 0 ; i < server.length; i++){
            if(!highest.name){
                highest.name = server[i].n;
                highest.score = server[i].p;
                highest.server = name || server[i].name;
            }else if(server[i].p > highest.score){
                highest.name = server[i].n;
                highest.score = server[i].p;
                highest.server = name || server[i].name;
            }
        }
    }
    return JSON.stringify(highest);
}

function real_score(a) {
    (20000 <= a) ? (a = 1000 * (a - 20000)) : ((10000 <= a) && (a = 100 * (a - 10000)));
    return a;
}


function real_score_2(a) {
    (20000 <= a) ? (a = 1000 * (a - 20000)) : ((10000 <= a) && (a = 100 * (a - 10000)));

    if(a > 1000) return String(Math.floor(a/1000)) + "K";
    return a;
}

function build_server_data(data, search){


    const messages = [];
    for(let name in data){

        let board = data[name].leaderboard;
        if(!board) continue;
        board = board.sort((a,b)=> real_score(b.p)-real_score(a.p));
        messages.push({SERVER: name,  NAME: board[0].n, SCORE: real_score_2(board[0].p)})

    }

    //console.log(JSON.stringify(leader_board));
    return messages
}

const client = new Discord.Client();

let things  = null;

const config = require("./config.json");

client.on("ready", () => {
    console.log("Bot ready");
});

client.on("message", async message => {
 
  if(message.author.bot) return;
  if (message.channel.id != "770303912619147305" ) {return}
  if(!message.content.startsWith(config.prefix)) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  if(command === "ping") { 
      if(!things){
          message.reply("Nothing in cache");
          return;
      };
      const string = JSON.stringify(build_server_data(things, args.join(" ")), null, 2)
        message.reply('```js\n' + string.substring(1, string.length-1) + '\n```')
  }

  if(command === "score2") {

    message.channel.send("Refreshing cache, one moment...").then((msg)=>{
        refresh_server_data((data)=>{
            msg.edit("Cache successfully refreshed");
            things = data;
            if(!things){
                message.reply("Nothing in cache");
                return;
            };
            const string = JSON.stringify(build_server_data(things, args.join(" ")), null, 2)
              message.reply('```json' + string.substring(1, string.length-1) + '```')
        })
    })
  }

  if(command === "high_score") {
    if(!things) return;
    message.reply(high_score(things));
  }

});

client.login(config.token);
