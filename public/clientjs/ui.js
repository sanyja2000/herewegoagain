class UIWindow{
    constructor(x,y,imgsrc){
        this.pos = {x:x,y:y}
        this.bgImg = new Image()
        this.bgImg.src = imgsrc
        this.buttons = []
        this.margins = {x:0,y:0}
        this.zoomLevel = 4
        this.needsClosing = false
    }
    render(renderer){
        this.renderBg(renderer);
    }
    renderBg(renderer){
        this.margins.x = (WIDTH-this.bgImg.width*renderer.zoomLevel)/2
        this.margins.y = (HEIGHT-this.bgImg.height*renderer.zoomLevel)/2
        this.zoomLevel = renderer.zoomLevel
        renderer.ctx.drawImage(this.bgImg,this.margins.x,this.margins.y,this.bgImg.width*this.zoomLevel,this.bgImg.height*this.zoomLevel)
        //console.log("<UIWindow> render not implemented")
    }
    checkButtons(mouse){
        if(mouse.left==1){
            for(let b of this.buttons){
                if(this.margins.x+16*b.x*this.zoomLevel< mouse.x && 
                    this.margins.x+16*b.x*this.zoomLevel+b.w*16*this.zoomLevel > mouse.x &&
                    this.margins.y+16*b.y*this.zoomLevel< mouse.y && 
                    this.margins.y+16*b.y*this.zoomLevel+b.h*16*this.zoomLevel > mouse.y ){
                        b.action(this,"left")
                }
            }
        }
        else if(mouse.right==1){
            for(let b of this.buttons){
                if(this.margins.x+16*b.x*this.zoomLevel< mouse.x && 
                    this.margins.x+16*b.x*this.zoomLevel+b.w*16*this.zoomLevel > mouse.x &&
                    this.margins.y+16*b.y*this.zoomLevel< mouse.y && 
                    this.margins.y+16*b.y*this.zoomLevel+b.h*16*this.zoomLevel > mouse.y ){
                        b.action(this,"right")
                }
            }
        }
    }
    updateUI(data){

    }
}

// CUSTOM

class ChestWindow extends UIWindow{
    constructor() {
        super(16,16,"img/chest.png")
        this.buttons = [{x:0,y:0,w:1,h:1,action:this.escapeUI.bind(this)}]
        this.hasIngredients = [false,false,false]
        this.content = Array.from(Array(24), item => null)
        this.playerInventory = Array.from(Array(8), item => null)
    }
    escapeUI(){
        
        this.needsClosing = true
    }
    renderSlot(renderer,x,y,item){
        if(item==null){
            return
        }
        renderer.renderItem(this.margins.x/renderer.zoomLevel+x,this.margins.y/renderer.zoomLevel+y,item.item.icon)
        renderer.ctx.fillText("x"+item.amount,(this.margins.x/renderer.zoomLevel+x+14)*renderer.zoomLevel,(this.margins.y/renderer.zoomLevel+y+14)*renderer.zoomLevel)

        
    }
    updateUI(data){
        this.buttons = [{x:0,y:0,w:1,h:1,action:this.escapeUI.bind(this)}]
        this.content = data.content
        this.playerInventory = data.playerInventory
        for(let i=0;i<this.content.length;i++){
            if(this.content[i]==null){
                continue
            }
            let x = i%8
            let y = Math.floor(i/8)
            this.buttons.push({x:1+x,y:1+y,w:1,h:1,action:this.moveItemToInv.bind(this,i)})
        }
        for(let i=0;i<this.playerInventory.length;i++){
            if(this.playerInventory[i]==null){
                continue
            }
            let x = i%8
            this.buttons.push({x:1+x,y:4,w:1,h:1,action:this.moveItemToChest.bind(this,i)})
        }

        //console.log(data)
    }
    moveItemToInv(slot,_this,btn){
        //game.socket.emit("event",{type:"uievent",details:{to:"inventory",slot:slot}})
        if(btn == "left"){
            game.socket.emit("event",{type:"uievent",details:{to:"inventory",slot:slot,amount:1}})
        }else{
            game.socket.emit("event",{type:"uievent",details:{to:"inventory",slot:slot,amount:this.content[slot].amount}})
        }
    }
    moveItemToChest(slot,_this,btn){
        if(btn == "left"){
            game.socket.emit("event",{type:"uievent",details:{to:"chest",slot:slot,amount:1}})
        }else{
            game.socket.emit("event",{type:"uievent",details:{to:"chest",slot:slot,amount:this.playerInventory[slot].amount}})
        }
    }

    render(renderer){
        super.render(renderer)
        renderer.ctx.font = "20px Courier"
        renderer.ctx.textAlign = "right"
        renderer.ctx.fillStyle = "white"
        for(let i=0;i<this.content.length;i++){
            let x = i%8
            let y = Math.floor(i/8)
            this.renderSlot(renderer,16+x*16,16+16*y,this.content[i])
        }
        for(let i=0;i<this.playerInventory.length;i++){
            let x = i%8
            this.renderSlot(renderer,16+x*16,64,this.playerInventory[i])
        }
    }
}

class CraftingTableWindow extends UIWindow{
    constructor() {
        super(16,16,"img/craftingtable.png")
        this.buttons = [{x:0,y:0,w:1,h:1,action:this.escapeUI.bind(this)}]
        this.hasIngredients = [false,false,false,false,false,false]
        this.craftables = []
        this.ingredients = Array.from(Array(24), item => null)
        this.selectedItemAm = null
        this.currentPage = 0
        this.selectedItemIndex = -1
    }
    escapeUI(){
        game.audioHandler.playAudio("craftingOpen")
        this.needsClosing = true
    }
    renderSlot(renderer,x,y,item,shaded,noText){
        if(item==null){
            return
        }
        renderer.renderItem(this.margins.x/renderer.zoomLevel+x,this.margins.y/renderer.zoomLevel+y,item.item.icon)
        if(!noText){
            renderer.ctx.fillText("x"+item.amount,(this.margins.x/renderer.zoomLevel+x+14)*renderer.zoomLevel,(this.margins.y/renderer.zoomLevel+y+14)*renderer.zoomLevel)
        }
        if(shaded){
            renderer.ctx.fillStyle = "rgba(0,0,0,0.4)"
            renderer.ctx.fillRect((this.margins.x/renderer.zoomLevel+x)*renderer.zoomLevel,(this.margins.y/renderer.zoomLevel+y)*renderer.zoomLevel,16*renderer.zoomLevel,16*renderer.zoomLevel)
        }
    }
    tryCraft(){
        if(this.selectedItemIndex != -1){
            game.socket.emit("event",{type:"uievent",details:{event:"crafting",slot:this.selectedItemIndex}})
        }
    }
    changePage(n){
        game.audioHandler.playAudio("craftingOpen")
        console.log("change page to "+n)
    }
    selectItem(n){
        game.socket.emit("event",{type:"uievent",details:{event:"selecting",slot:n}})
        this.selectedItemIndex = n
    }
    updateUI(data){
        game.audioHandler.playAudio("craftingOpen")
        this.buttons = [{x:0,y:0,w:1,h:1,action:this.escapeUI.bind(this)},
            {x:3,y:4,w:1,h:1,action:this.changePage.bind(this,-1)}, // previous page
            {x:4,y:4,w:1,h:1,action:this.changePage.bind(this,1)}, // next page
            {x:6,y:4,w:3,h:1,action:this.tryCraft.bind(this)}
        ]
        this.craftables = data.craftables
        this.selectedItemAm = data.selectedItemAm
        this.ingredients = data.ingredients
        this.hasIngredients = data.hasIngredients
        for(let i=this.currentPage*18;i<(this.currentPage+1)*18;i++){
            if(i>=this.craftables.length){
                break
            }
            if(this.craftables[i]==null){
                continue
            }
            let x = i%4
            let y = Math.floor(i/4)
            this.buttons.push({x:1+x,y:1+y,w:1,h:1,action:this.selectItem.bind(this,i)})
        }

        //console.log(data)
    }


    render(renderer){
        super.render(renderer)
        renderer.ctx.font = "20px Courier"
        renderer.ctx.textAlign = "right"
        renderer.ctx.fillStyle = "white"
        for(let i=this.currentPage*18;i<(this.currentPage+1)*18;i++){
            if(i>=this.craftables.length){
                break
            }
            let x = (i-this.currentPage*18)%4
            let y = Math.floor((i-this.currentPage*18)/4)
            this.renderSlot(renderer,16+x*16,16+16*y,this.craftables[i],false,true)
        }
        for(let i=0;i<this.ingredients.length;i++){
            renderer.ctx.fillStyle = "white"
            if(this.ingredients[i]==null){
                break
            }
            let x = i%3
            let y = Math.floor(i/2)
            this.renderSlot(renderer,16*6+x*16,16*2+y*16,this.ingredients[i],!this.hasIngredients[i])
        }
        if(this.selectedItemAm!=null){
            this.renderSlot(renderer,16*6,16,this.selectedItemAm,false)
            
            renderer.ctx.fillStyle = "black"
            renderer.ctx.textAlign = "left"
            
            renderer.ctx.fillText(this.selectedItemAm.item.name,(this.margins.x/renderer.zoomLevel+114)*renderer.zoomLevel,(this.margins.y/renderer.zoomLevel+25)*renderer.zoomLevel)
        }
    }
}



class PlantHelperWindow extends UIWindow{
    constructor() {
        super(16,16,"img/planthelper.png")
        this.buttons = [{x:6,y:4,w:1,h:1,action:this.escapeUI.bind(this)},{x:8,y:4,w:1,h:1,action:this.pressedOkay.bind(this)}]
        this.hasIngredients = [false,false,false]
        this.recipe = []
    }
    escapeUI(btn){
        this.needsClosing = true
        
    }
    pressedOkay(btn){
        // need to send uievent
        // TODO: FIX THIS
        game.socket.emit("event",{type:"uievent",details:{az:"RTL 2"}})
    }
    renderSlot(renderer,x,y,item,shaded){
        if(item==null){
            return
        }
        renderer.renderItem(this.margins.x/renderer.zoomLevel+x,this.margins.y/renderer.zoomLevel+y,item.item.icon)
        //if(item.amount>1){
            renderer.ctx.fillText("x"+item.amount,(this.margins.x/renderer.zoomLevel+x+14)*renderer.zoomLevel,(this.margins.y/renderer.zoomLevel+y+14)*renderer.zoomLevel)
        //}
        if(shaded){
            renderer.ctx.fillStyle = "rgba(0,0,0,0.4)"
            renderer.ctx.fillRect((this.margins.x/renderer.zoomLevel+x)*renderer.zoomLevel,(this.margins.y/renderer.zoomLevel+y)*renderer.zoomLevel,16*renderer.zoomLevel,16*renderer.zoomLevel)
        }
    }
    updateUI(data){
        this.recipe = data.recipe
        this.hasIngredients = data.hasIngredients
        //console.log(data)
    }
    render(renderer){
        super.render(renderer)
        renderer.ctx.font = "20px Courier"
        renderer.ctx.textAlign = "right"
        for(let i=0;i<this.recipe.length;i++){
            renderer.ctx.fillStyle = "white"
            this.renderSlot(renderer,16+i*32,32,this.recipe[i],!this.hasIngredients[i])
        }
    }
}

// HUD

class Inventory extends UIWindow{
    constructor(){
        super(16,16,"img/inventory.png")
        this.items = Array.from(Array(8),item => null)
        
    }
    render(renderer){
        this.renderBg(renderer);
        this.renderItems(renderer);
    }
    renderSlot(renderer,x,y,item){
        if(item==null){
            return
        }
        renderer.renderItem(this.margins.x/renderer.zoomLevel+x,this.margins.y/renderer.zoomLevel+y+8,item.item.icon)
        if(item.amount>1){
            renderer.ctx.fillText("x"+item.amount,(this.margins.x/renderer.zoomLevel+x+14)*renderer.zoomLevel,(this.margins.y/renderer.zoomLevel+y+22)*renderer.zoomLevel)
        }
    }
    renderItems(renderer){
        renderer.ctx.fillStyle = "white"
        renderer.ctx.font = "20px Courier"
        renderer.ctx.textAlign = "right"
        if(this.items[3]!=null){
            this.renderSlot(renderer,62,0,this.items[3])
        }
        if(this.items[4]!=null){
            this.renderSlot(renderer,82,0,this.items[4])
        }
        for(let i=0;i<3;i++){
            this.renderSlot(renderer,18*i,0,this.items[i])
            /*
            if(this.items[i]!=null){
                renderer.renderItem(this.margins.x/renderer.zoomLevel+18*i-36,this.margins.y/renderer.zoomLevel+8,this.items[i].item.icon)
                if(this.items[i].amount>1){
                    renderer.ctx.fillText("x"+this.items[i].amount,(this.margins.x/renderer.zoomLevel+96)*renderer.zoomLevel,(this.margins.y/renderer.zoomLevel+22)*renderer.zoomLevel)
                }
            }*/
        }
        for(let i=5;i<8;i++){
            this.renderSlot(renderer,18*i+16,0,this.items[i])
        }
        
    }
    renderBg(renderer){
        this.margins.x = (WIDTH-this.bgImg.width*renderer.zoomLevel)/2
        this.margins.y = (HEIGHT-this.bgImg.height*renderer.zoomLevel)-10
        this.zoomLevel = renderer.zoomLevel
        renderer.ctx.drawImage(this.bgImg,this.margins.x,this.margins.y,this.bgImg.width*this.zoomLevel,this.bgImg.height*this.zoomLevel)
        //console.log("<UIWindow> render not implemented")
    }
    updateUI(data){
        this.items = data.items
    }
    requestUpdate(){
        game.socket.emit("event",{type:"uievent",details:{window:"inventory",event:"update"}})
    }
}

class Thermometer extends UIWindow{
    constructor(){
        // < 34°C hypothermia
        // > 42°C hyperthermia
        super(16,16,"img/thermometer.png")
        this.pointer = new Image()
        this.pointer.src = "img/thermopointer.png"
        this.temperature = 38
    }
    renderBg(renderer){
        this.margins.x = WIDTH-80//(WIDTH-this.bgImg.width*renderer.zoomLevel)/2
        this.margins.y = (HEIGHT-this.bgImg.height*renderer.zoomLevel)/2
        this.zoomLevel = renderer.zoomLevel
        renderer.ctx.drawImage(this.bgImg,this.margins.x,this.margins.y,this.bgImg.width*this.zoomLevel,this.bgImg.height*this.zoomLevel)
        //console.log("<UIWindow> render not implemented")
    }
    render(renderer){
        this.renderBg(renderer)
        let yoff = (8-(this.temperature-34))*8*renderer.zoomLevel-this.pointer.height/2*renderer.zoomLevel+16*renderer.zoomLevel
        renderer.ctx.drawImage(this.pointer,this.margins.x-16,this.margins.y+yoff,this.pointer.width*this.zoomLevel,this.pointer.height*this.zoomLevel)
    }
}

class UIHandler{
    constructor(){
        this.windows = {"planthelper":new PlantHelperWindow(),"chest":new ChestWindow(),"craftingtable":new CraftingTableWindow()}
        this.currentWindow = undefined//this.windows["planthelper"]
        this.inventory = new Inventory()
        this.thermometer = new Thermometer()
    }
    render(renderer){
        this.inventory.render(renderer)
        this.thermometer.render(renderer)
        if(this.currentWindow!=undefined){
            if(this.currentWindow.needsClosing){
                this.currentWindow.needsClosing = false
                this.currentWindow = undefined
            }else{
                this.currentWindow.render(renderer)
            }
        }

    }
    isUIOpen(){
        if(this.currentWindow!=undefined){
            return true
        }
        return false
    }
    checkInteraction(inputHandler){
        if(this.currentWindow!=undefined){
            this.currentWindow.checkButtons(inputHandler.mouse)
        }
    
    }
    receiveUIEvent(data){
        if(data.window == "inventory"){
            this.inventory.updateUI(data.toDisplay)
        }else{
            this.currentWindow = this.windows[data.window]
            this.currentWindow.updateUI(data.toDisplay)
            this.inventory.requestUpdate()
        }
    }

}