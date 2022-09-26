
const itemHandler = require('./serverjs/itemHandler')
const mapGenerator = require('./serverjs/mapGenerator')

function getTimestamp(){
    return "["+new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').split(" ")[1]+"] "
}

global.tslog=function(txt){
    console.log(getTimestamp()+txt)
}



class ActiveItem{
    constructor(){

    }
}
class ActiveItemHandler{
    constructor(){

    }
}



class Player{
    constructor(id){
        this.id = id
        this.pos = {x:0,y:0}
        this.vel = {x:0, y:0}
        this.facing = 0
        this.useCooldown = 0
        this.temperature = 37.5
        // 8 slots; 0-1 are left-right
        this.inventory = [{item:global.itemHandler.getItemFromName("Pickaxe"),amount:1},null,{item:global.itemHandler.getItemFromName("CraftingTable"),amount:1},{item:global.itemHandler.getItemFromName("PlantHelper"),amount:1},null,{item:global.itemHandler.getItemFromName("Chest"),amount:1},null,{item:global.itemHandler.getItemFromName("Match"),amount:10}]
        this.currentActiveBlock = undefined
    }
    update(){
        this.changeTemperature(-0.001)
    }
    getObj(){
        return {id:this.id,pos:this.pos,vel:this.vel,facing:this.facing,temperature:this.temperature}
    }
    updateInventory(){
        global.ch.sendToPlayer(this.id,"uievent",{window:"inventory",toDisplay:{items:this.inventory}})
    }
    scrollInventory(){
        this.inventory = this.inventory.slice(-1).concat(this.inventory.slice(0, -1))
        this.updateInventory()
    }
    playAudio(audio,volume){
        global.ch.sendToPlayer(this.id,"audioevent",{audio:audio,volume:volume})
    }
    addToInventory(item,amount){
        let remainingAmount = amount
        for(let slot of this.inventory){
            if(slot==null){
                continue
            }
            if(slot.item.id==item.id && slot.amount<slot.item.stack){
                if(slot.amount+amount>slot.item.stack){
                    // fill the slot save remainder
                    remainingAmount -= item.stack-slot.amount
                    slot.amount = item.stack
                    continue
                }
                if(slot.amount+amount<=item.stack){
                    slot.amount += amount
                    remainingAmount = 0
                    continue
                }
            }
        }
        let freeSlotPlace = this.inventory.indexOf(null)
        while(freeSlotPlace>-1 && remainingAmount>0){
            if(remainingAmount<=item.stack){
                this.inventory[freeSlotPlace] = {item:item,amount:remainingAmount}
                remainingAmount = 0
                break
            }else{
                this.inventory[freeSlotPlace] = {item:item,amount:item.stack}
                remainingAmount-=item.stack
            }
            freeSlotPlace = this.inventory.indexOf(null)
        }
        if(freeSlotPlace==-1 && remainingAmount>0){
            //console.log("Not enough inventory space!")
        }
        this.updateInventory()
    }
    removeFromInventory(item,amount){
        let remainingAmount = amount
        for(let slot of this.inventory){
            if(slot==null){
                continue
            }
            if(slot.item.id==item.id){
                if(slot.amount-remainingAmount<=0){
                    // remove the slot save remainder
                    remainingAmount -= slot.amount
                    this.inventory[this.inventory.indexOf(slot)] = null
                    continue
                }
                if(slot.amount-remainingAmount>0){
                    slot.amount -= remainingAmount
                    remainingAmount = 0
                    break
                }
            }
        }
        this.updateInventory()
    }
    hasInventoryItem(item,requiredAmount){
        let itemAmount = 0
        for(let slot of this.inventory){
            if(slot==null){
                continue
            }
            if(slot.item.id==item.id){
                itemAmount+=slot.amount
            }
        }
        if(itemAmount>=requiredAmount){
            return true
        }
        return false
    }
    useItem(slot,place){
        if(this.inventory[slot]==null){
            return
        }
        if(this.inventory[slot].item.name == "Pickaxe"){
            if(global.gs.now-this.useCooldown<250){
                return
            }
            this.useCooldown = global.gs.now
            
            mapGen.removeBlock(place.x,place.y,this)
            return
        }
        let block = global.itemHandler.getBlockFromItemName(this.inventory[slot].item.name)
        if(block!=null){
            if(mapGen.placeBlock(place.x,place.y,block.icon)){
                this.removeFromInventory(this.inventory[slot].item,1)
                return
            }
        }
        if(this.inventory[slot].item.isActive){
            global.itemHandler.useActiveItem(this,this.inventory[slot])
        }
    }
    interactWith(place){
        mapGen.abh.interactWith(this,place.x,place.y)
    }
    uiEvent(details){
        if(details.window == "inventory"){
            if(details.event == "update"){
                // send uiupdate to player
                this.updateInventory()
                //global.ch.sendToPlayer(this.id,"uievent",{window:"inventory",toDisplay:{items:this.inventory}})
            }
        }
        else if(this.currentActiveBlock != undefined){
            mapGen.abh.uiEvent(this,details)
        }
    }
    changeTemperature(temp){
        this.temperature = Math.min(Math.max(this.temperature+temp,34),42)
    }
    calcDistanceFrom(x,y){
        return Math.sqrt(Math.pow(x-this.pos.x,2)+Math.pow(y-this.pos.y,2))
    }
}

class ConnectionHandler {
    constructor(){
        let express = require('express')
        let app = express()
        let server = app.listen(80);
        app.use(express.static("public"))
        global.tslog("Server sucessfully started!")
        let socket = require('socket.io')
        this.io = socket(server)
        this.io.sockets.on('connection',this.newConnection)
    }
    newConnection(socket){
        global.tslog("New connection:"+socket.id)
        socket.emit("init",{genMap:mapGen.coveredMap,mapW:mapGen.mapWidth,mapH:mapGen.mapHeight,solidBlocks:global.itemHandler.solidBlocks,activeBlocks:global.itemHandler.activeBlocks})
        global.gs.addPlayer(socket.id)
        socket.on("disconnect",lostConnection)
        socket.on("event",handleEvent)
        function handleEvent(data){
            if(data.type == "move"){
                for(let p of global.gs.players){
                    if(p.id == socket.id){
                        p.pos = data.pos
                        p.vel = data.vel
                        p.facing = data.facing
                        return
                    }
                }
            }
            if(data.type == "use"){
                for(let p of global.gs.players){
                    if(p.id == socket.id){
                        p.useItem(data.slot,data.place)
                        return
                    }
                }
            }
            if(data.type == "interact"){
                for(let p of global.gs.players){
                    if(p.id == socket.id){
                        p.interactWith(data.place)
                        return
                    }
                }
            }
            if(data.type == "uievent"){
                for(let p of global.gs.players){
                    if(p.id == socket.id){
                        p.uiEvent(data.details)
                        return
                    }
                }
            }
            if(data.type == "scrollInv"){
                for(let p of global.gs.players){
                    if(p.id == socket.id){
                        p.scrollInventory()
                        return
                    }
                }
            }

        }
        function lostConnection(data){
            global.gs.removePlayer(socket.id)
        }
    }
    sendToPlayer(playerId,type,data){
        this.io.to(playerId).emit(type,data);
    }
    updatePlayers(players,mobs){
        let playerObjs = []
        for(let p of players){
            p.update()
            playerObjs.push(p.getObj())
        }
        let mobObjs = []
        for(let m of mobs){
            m.update()
            mobObjs.push(m.getObj())
        }
        this.io.sockets.emit("update",{type:"entities",playerArr:playerObjs,mobsArr:mobObjs})
    }
    updateMap(players){
        global.mapGen.coverMap()
        this.io.sockets.emit("update",{type:"map",genMap:mapGen.coveredMap})//generatedMap})
    }
    
}

class GameServer{
    constructor() {
        this.players = []
        this.mobs = []
        global.mapGen.generateMobs(this.mobs)
        console.log(this.mobs)
        this.updateLoop = setInterval(this.updateServer.bind(this),1000/60)
        this.now = Date.now()
    }
    addPlayer(id){
        this.players.push(new Player(id))
    }
    removePlayer(id){
        for(let p of this.players){
            if(p.id == id){
                this.players.splice(this.players.indexOf(p),1)
                return
            }
        }
    }
    updateServer(){
        this.now = Date.now()
        global.ch.updatePlayers(this.players,this.mobs)
        if(global.mapGen.abh.updateActiveBlocks(this.now)){
            this.updateMap(this.players)
        }
    }
    updateMap(){
        global.ch.updateMap(this.players)
    }
}

global.itemHandler = new itemHandler.ItemHandler()
global.mapGen = new mapGenerator.MapGenerator()
global.ch = new ConnectionHandler()
global.gs = new GameServer()
