
class InputHandler{
    constructor(){
        this.keysDown = {}
        this.mouse = {x:0,y:0,left:0,right:0}
        this.currentTile = {x:0,y:0}
    }
    keyDownEvent(evt){
        this.keysDown[evt.code] = 1
    }
    keyUpEvent(evt){
        this.keysDown[evt.code] = 0
    }
    isKeyDown(key){
        if(key in this.keysDown && this.keysDown[key] == 2){
            return true
        }
        return false
    }
    isKeyPressed(key){
        if(key in this.keysDown && this.keysDown[key] == 1){
            return true
        }
        return false
    }
    mouseDownEvent(evt){
        if(evt.button==0){
            this.mouse.left = 1
        }
        if(evt.button==2){
            this.mouse.right = 1
        }
    }
    mouseUpEvent(evt){
        if(evt.button==0){
            this.mouse.left = 0
        }
        if(evt.button==2){
            this.mouse.right = 0
        }
    }
    updateMouse(){
        if(this.mouse.left == 1){
            this.mouse.left = 2
        }
        if(this.mouse.right == 1){
            this.mouse.right = 2
        }
    }
    updateKeys(){
        for(let key of Object.entries(this.keysDown)){
            if(key[1]==1){
                this.keysDown[key[0]]=2
            }
        }
    }
    mouseMoveEvent(evt){
        this.mouse.x = evt.clientX
        this.mouse.y = evt.clientY
    }
    getCurrentTile(renderer){
        /*
        let cx = Math.floor(renderer.camera.x/16)
        let cy = Math.floor(renderer.camera.y/16)
        let x = Math.floor((this.mouse.x+48)/16/renderer.zoomLevel)+cx
        let y = Math.floor((this.mouse.y+32)/16/renderer.zoomLevel)+cy
        return {x:x,y:y}
        */
        return this.currentTile
        
    }
}


class Game{
    constructor() {
        this.socket = io.connect(window.location.href)
        this.socket.on("init",this.initWorld.bind(this))
        this.socket.on("update",this.receiveUpdate.bind(this))
        
        this.renderer = new Renderer()
        
        this.socket.on("uievent",this.renderer.uiHandler.receiveUIEvent.bind(this.renderer.uiHandler))
        
        this.fpsc = new FPSCounter()
        this.audioHandler = new AudioHandler()
        this.audioHandler.loadRequiredSounds()
        this.socket.on("audioevent",this.audioHandler.playServerAudio.bind(this.audioHandler))
        this.inputHandler = new InputHandler()

        this.mapData = {map:[],mapWidth:0,mapHeight:0}
        this.player = new Player()
        this.inputHandler.currentTile = {x:this.player.x/16,y:this.player.y/16}
        this.otherPlayers = []
        this.mobs = []
        requestAnimationFrame(this.mainloop.bind(this))
    }
    initWorld(data){
        this.mapData.mapWidth = data.mapW
        this.mapData.mapHeight = data.mapH
        this.mapData.map = data.genMap
        this.player.solidBlocks = data.solidBlocks
        this.player.activeBlocks = data.activeBlocks
        this.renderer.uiHandler.inventory.requestUpdate()
    }
    receiveUpdate(data){
        if(data.type == "entities"){
            this.otherPlayers = data.playerArr
            for(let p of this.otherPlayers){
                if(p.id == this.player.id){
                    this.player.temperature = p.temperature
                    break
                }
            }
            this.mobs = data.mobsArr
        }
        if(data.type == "map"){
            this.mapData.map = data.genMap
        }
    }
    sendToServer(){
        this.socket.emit("event",{type:"move",pos:this.player.pos,vel:this.player.vel,facing:this.player.facing})
    }
    getMapData(x,y){
        return this.mapData.map[y*this.mapData.mapWidth+x]
    }
    mainloop(){
        if(this.socket.connected){
            this.player.id = this.socket.id
        }
        this.fpsc.update()
        if(this.renderer.uiHandler.currentWindow == undefined){
            this.player.handleInput(this.inputHandler)
        }else{
            this.player.isMoving = false
        }
        this.player.updatePos(this.fpsc.getDT())
        this.player.checkCollision(this.mapData)

        this.sendToServer()
        
        this.moveCamera()
        this.checkInteraction()
        this.renderer.spriteRenderer.updateAllSprites(this.fpsc.currentTime)
        
        this.renderer.uiHandler.thermometer.temperature = this.player.temperature
        this.renderer.render(this.mapData,this.player,this.otherPlayers,this.mobs)
        this.renderer.renderBox(this.inputHandler.mouse,this.player)
        this.renderer.uiHandler.render(this.renderer)
        this.inputHandler.updateMouse()
        this.inputHandler.updateKeys()
        requestAnimationFrame(this.mainloop.bind(this))
    }
    checkInteraction(){
        if(this.renderer.uiHandler.isUIOpen()){
            this.renderer.uiHandler.checkInteraction(this.inputHandler)
            return
        }

        let place = this.inputHandler.getCurrentTile(this.renderer)
        let usedSlot = -1
        if(this.inputHandler.mouse.left == 1){
            if(place==undefined){
                return
            }
            
            this.socket.emit("event",{type:"use",slot:3,place:place})
            usedSlot = 3

        }
        if(this.inputHandler.mouse.right == 1){
            if(place==undefined){
                return
            }

            this.socket.emit("event",{type:"use",slot:4,place:place})
            usedSlot = 4
            
        }
        if(usedSlot>-1){
            if(game.renderer.uiHandler.inventory.items[usedSlot] != null){
                let itemName = game.renderer.uiHandler.inventory.items[usedSlot].item.name
                if(itemName == "Pickaxe"){
                    this.renderer.spriteRenderer.startAnim("pickaxe")
                    this.audioHandler.playAudio("pickaxe")
                }
                else{
                    this.audioHandler.playAudio("placeStuff")
                }
            }
        }
        if(this.inputHandler.isKeyPressed("KeyE")){
            
            if(this.inputHandler.getCurrentTile(this.renderer)==undefined){
                return
            }
            if(this.player.activeBlocks.indexOf(this.getMapData(place.x,place.y))==-1){
                return
            }
            this.socket.emit("event",{type:"interact",place:place})
        }
        if(this.inputHandler.isKeyPressed("KeyR")){
            this.socket.emit("event",{type:"scrollInv"})
        }
    }
    moveCamera(){
        if(this.inputHandler.isKeyDown("ArrowLeft")){
            this.renderer.camera.x += -100*this.fpsc.getDT()
        }
        if(this.inputHandler.isKeyDown("ArrowRight")){
            this.renderer.camera.x += 100*this.fpsc.getDT()
        }
        if(this.inputHandler.isKeyDown("ArrowUp")){
            this.renderer.camera.y += -100*this.fpsc.getDT()
        }
        if(this.inputHandler.isKeyDown("ArrowDown")){
            this.renderer.camera.y += 100*this.fpsc.getDT()
        }
        if(this.renderer.camera.fixed){
            this.renderer.camera.x += (this.player.pos.x - WIDTH/2/this.renderer.zoomLevel+16- this.renderer.camera.x) *0.05
            this.renderer.camera.y += (this.player.pos.y - HEIGHT/2/this.renderer.zoomLevel -this.renderer.camera.y) *0.05
            /*
            if(this.renderer.camera.x<0){
                this.renderer.camera.x = 0
            }
            if(this.renderer.camera.y<0){
                this.renderer.camera.y = 0
            }*/
        }
    }
}