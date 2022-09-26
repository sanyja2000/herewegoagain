class ActiveBlock{
    constructor(x,y) {
        this.name = "<activeBlockName>"
        this.pos = {x:x,y:y}
        this.imageChanged = false
        this.selfDestruct = false
        this.removable = true
    }
    interactWith(player,details){
        tslog("interactWith not implemented")
    }
    update(now){
        return
    }
    uiEvent(player){
        return
    }
}

class PlantHelperBlock extends ActiveBlock {
    constructor(x,y){
        super(x,y)
        this.name = "PlantHelper"
        this.state = "idle"
        this.startTime = 0
        this.currentImage = 51
        this.doneItemAm = null
        this.recipe = [{name:"Seed",amount:2},{name:"Ice",amount:1},{name:"Nitrate",amount:3}]
        this.itemRecipe = []
        for(let ing of this.recipe){
            this.itemRecipe.push({item:global.itemHandler.getItemFromName(ing.name),amount:ing.amount})
        }
    }
    update(now){
        if(this.state == "growing"){
            if(now-this.startTime>5000){
                this.state = "idle"
                this.removable = true
                this.currentImage = 51
                this.imageChanged = true
                this.doneItemAm = {item:global.itemHandler.getItemFromName("Wheat"),amount:2}
            }
        }
    }
    interactWith(player){
        if(this.doneItemAm != null){
            player.addToInventory(this.doneItemAm.item, this.doneItemAm.amount)
            this.doneItemAm = null
        }
        let hasAllIngredients = [false,false,false]
        
        for(let ing of this.recipe){
            if(player.hasInventoryItem(global.itemHandler.getItemFromName(ing.name),ing.amount)){
                hasAllIngredients[this.recipe.indexOf(ing)] = true
            }
        }
        if(this.state == "growing"){
            hasAllIngredients = [false,false,false]
        }
        global.ch.sendToPlayer(player.id,"uievent",{window:"planthelper",toDisplay:{recipe:this.itemRecipe,hasIngredients:hasAllIngredients}})
    }
    uiEvent(player,details){
        if(this.state == "growing"){
            return
        }
        let hasAllIngredients = true
        for(let ing of this.recipe){
            if(!player.hasInventoryItem(global.itemHandler.getItemFromName(ing.name),ing.amount)){
                hasAllIngredients = false
                break
            }
        }
        if(hasAllIngredients){
            for(let ing of this.recipe){
                player.removeFromInventory(global.itemHandler.getItemFromName(ing.name),ing.amount)
                this.startTime = global.gs.now
                this.state = "growing"
                this.removable = false
                this.currentImage = 52
                this.imageChanged = true
            }
            
        }
        //global.ch.sendToPlayer(player.id,"uievent",{window:"planthelper",toDisplay:{counter:this.counter}})
        this.interactWith(player)
    }

}


class CraftingTableBlock extends ActiveBlock {
    constructor(x,y){
        super(x,y)
        this.name = "CraftingTable"
        this.currentImage = 57
    }
    update(now){}
    interactWith(player){
        
        let hasAllIngredients = [false,false,false,false,false,false]       
        global.ch.sendToPlayer(player.id,"uievent",{window:"craftingtable",toDisplay:{craftables:global.itemHandler.craftRecipes,ingredients:Array.from(Array(6), item => null),selectedItemAm:null,hasIngredients:hasAllIngredients}})
    }
    uiEvent(player,details){
        
        let hasAllIngredients = [false,false,false,false,false,false]
        if(details.event == "selecting"){
            let recipe = global.itemHandler.craftRecipes[details.slot]
            if(recipe==undefined){
                return
            }
            let ingredients = Array.from(Array(6), item => null)
            for(let i=0;i<recipe.ingredients.length;i++){
                let itemAm = {item:global.itemHandler.getItemFromName(recipe.ingredients[i].itemName),amount:recipe.ingredients[i].amount}
                ingredients[i]=itemAm
                if(itemAm == null){
                    break
                }
                if(player.hasInventoryItem(itemAm.item,itemAm.amount)){
                    hasAllIngredients[i] = true
                }
            }
            let selectedItemAm = {item:recipe.item,amount:recipe.amount}
            global.ch.sendToPlayer(player.id,"uievent",{window:"craftingtable",toDisplay:{craftables:global.itemHandler.craftRecipes,ingredients:ingredients,selectedItemAm:selectedItemAm,hasIngredients:hasAllIngredients}})
        
        }
        if(details.event == "crafting"){
            let recipe = global.itemHandler.craftRecipes[details.slot]
            if(recipe==undefined){
                return
            }
            let ingredients = Array.from(Array(6), item => null)
            let hasAllIng = true
            for(let i=0;i<recipe.ingredients.length;i++){
                let itemAm = {item:global.itemHandler.getItemFromName(recipe.ingredients[i].itemName),amount:recipe.ingredients[i].amount}
                ingredients[i]=itemAm
                if(itemAm == null){
                    break
                }
                if(player.hasInventoryItem(itemAm.item,itemAm.amount)){
                    hasAllIngredients[i] = true
                }else{
                    hasAllIng = false
                }
            }
            if(hasAllIng){
                // Craft Ingredient
                for(let i=0;i<recipe.ingredients.length;i++){
                    let itemAm = {item:global.itemHandler.getItemFromName(recipe.ingredients[i].itemName),amount:recipe.ingredients[i].amount}
                    if(itemAm == null){
                        break
                    }
                    player.removeFromInventory(itemAm.item,itemAm.amount)

                }
                player.addToInventory(recipe.item,recipe.amount)
            }
            player.updateInventory()
            ingredients = Array.from(Array(6), item => null)
            hasAllIngredients = [false,false,false,false,false,false]
            for(let i=0;i<recipe.ingredients.length;i++){
                let itemAm = {item:global.itemHandler.getItemFromName(recipe.ingredients[i].itemName),amount:recipe.ingredients[i].amount}
                ingredients[i]=itemAm
                if(itemAm == null){
                    break
                }
                if(player.hasInventoryItem(itemAm.item,itemAm.amount)){
                    hasAllIngredients[i] = true
                }
            }
            let selectedItemAm = {item:recipe.item,amount:recipe.amount}
            
            global.ch.sendToPlayer(player.id,"uievent",{window:"craftingtable",toDisplay:{craftables:global.itemHandler.craftRecipes,ingredients:ingredients,selectedItemAm:selectedItemAm,hasIngredients:hasAllIngredients}})

            //global.ch.sendToPlayer(player.id,"uievent",{window:"craftingtable",toDisplay:{craftables:global.itemHandler.craftRecipes,ingredients:ingredients,selectedItemAm:selectedItemAm,hasIngredients:hasAllIngredients}})
        }
        
    }

}


class ChestBlock extends ActiveBlock {
    constructor(x,y){
        super(x,y)
        this.name = "Chest"
        this.content = Array.from(Array(24), s => null)
        this.currentImage = 53
    }
    update(now){
        this.removable = true
        for(let c of this.content){
            if(c!=null){
                this.removable = false
            }
        }
    }
    interactWith(player){
        global.ch.sendToPlayer(player.id,"uievent",{window:"chest",toDisplay:{content:this.content,playerInventory:player.inventory}})
    }

    uiEvent(player,details){
        let changed = false
        if(details.to == "inventory"){
            
            if(this.content[details.slot] == null){
                return
            }
            player.addToInventory(this.content[details.slot].item,details.amount)
            if(this.content[details.slot].amount == details.amount){
                this.content[details.slot] = null
            }else{
                this.content[details.slot].amount -= details.amount
            }

            changed = true
        }
        if(details.to == "chest"){
            if(player.inventory[details.slot] == null){
                return
            }
            let remaining = details.amount//player.inventory[details.slot].amount
            for(let i=0;i<this.content.length;i++){
                if(this.content[i]!=null && this.content[i].item.id == player.inventory[details.slot].item.id){
                    if(this.content[i].amount+remaining>this.content[i].item.stack){
                        remaining-=this.content[i].item.stack-this.content[i].amount
                        this.content[i].amount=this.content[i].item.stack
                        changed = true
                    }else{
                        this.content[i].amount+=remaining

                        remaining = 0
                        changed = true
                        break
                    }
                    
                }
            }
            if(remaining>0){
                for(let i=0;i<this.content.length;i++){
                    if(this.content[i]==null){
                        if(remaining==player.inventory[details.slot].amount){
                            this.content[i] = player.inventory[details.slot]
                            //player.inventory[details.slot] = null
                        }else{
                            this.content[i] = {item:player.inventory[details.slot].item,amount:remaining}
                            //player.inventory[details.slot].amount-=remaining
                        }
                        changed = true
                        break
                    }
                }
            }
            player.removeFromInventory(player.inventory[details.slot].item,details.amount)
        }
        if(changed){
            this.interactWith(player)
        }
    }

}

class CampfireBlock extends ActiveBlock{
    constructor(x,y){
        super(x,y)
        this.name = "Campfire"
        this.currentImage = 54
        this.burning = false
        this.burnTime = 10000
        this.imageSwTime = 500
        this.startTime = 0
        // 55,56
    }
    update(now){
        if(this.burning){
            if(now-this.startTime>this.burnTime){
                this.burning = false
                this.currentImage = 54
                this.imageChanged = true
            }
            if(Math.floor((now-this.startTime)/this.imageSwTime)%2==1 && this.currentImage == 56){
                this.currentImage = 55
                this.imageChanged = true
            }
            if(Math.floor((now-this.startTime)/this.imageSwTime)%2==0 && this.currentImage == 55){
                this.currentImage = 56
                this.imageChanged = true
            }
            for(let player of global.gs.players){
                if(Math.round(player.pos.x/16) == this.pos.x && Math.round(player.pos.y/16) == this.pos.y){
                    player.changeTemperature(0.006)
                }
            }
        }
    }
    interactWith(player){
        if(!this.burning){
            if(!player.hasInventoryItem(global.itemHandler.getItemFromName("Match"),1)){
                return
            }
            player.removeFromInventory(global.itemHandler.getItemFromName("Match"),1)
            this.burning = true
            this.currentImage = 55
            this.imageChanged = true
            this.startTime = global.gs.now
        }
        //global.ch.sendToPlayer(player.id,"uievent",{window:"chest",toDisplay:{content:this.content,playerInventory:player.inventory}})
    }
    uiEvent(player,details){
        
    }

}
class TNTBlock extends ActiveBlock{
    constructor(x,y){
        super(x,y)
        this.name = "TNT"
        this.currentImage = 58
        this.burning = false
        this.burnTime = 2500
        this.imageSwTime = 500
        this.startTime = 0
        // 58,59
    }
    update(now){
        if(this.burning){
            if(now-this.startTime>this.burnTime){
                // BOOM
                this.burning = false
                this.currentImage = 59
                this.imageChanged = true
                for(let player of global.gs.players){
                    let dist = player.calcDistanceFrom(this.pos.x*16,this.pos.y*16)
                    if(dist<160){
                        player.playAudio("tntExplosion",(160-dist)/200)
                        if(dist<48){
                            player.changeTemperature((3-dist/16)*2)
                        }
                    }
                }
                for(let x = this.pos.x-3;x<this.pos.x+4;x++){
                    for(let y = this.pos.y-3;y<this.pos.y+4;y++){
                        if(x==this.pos.x && y==this.pos.y){
                            continue
                        }
                        let acBlock = global.mapGen.abh.getActiveBlockAt(x,y)
                        if(acBlock!=null && acBlock.name == "TNT"){
                            if(!acBlock.burning){
                                acBlock.ignite(null)
                            }
                        }else{
                            global.mapGen.removeBlock(x,y,null,true,true)
                        }
                    }
                }
                this.removable = true
                this.selfDestruct = true
                return
            }
            if(Math.floor((now-this.startTime)/this.imageSwTime)%2==1 && this.currentImage == 59){
                this.currentImage = 58
                this.imageChanged = true
            }
            if(Math.floor((now-this.startTime)/this.imageSwTime)%2==0 && this.currentImage == 58){
                this.currentImage = 59
                this.imageChanged = true
            }
            
        }
    }
    ignite(player){
        if(player != null){
            player.removeFromInventory(global.itemHandler.getItemFromName("Match"),1)
        }
        this.burning = true
        this.removable = false
        this.currentImage = 58
        this.imageChanged = true
        this.startTime = global.gs.now
        for(let player of global.gs.players){
            let dist = player.calcDistanceFrom(this.pos.x*16,this.pos.y*16)
            if(dist<160){
                player.playAudio("tntActivate",(160-dist)/200)
            }
        }
    }
    interactWith(player){
        if(!this.burning){
            if(!player.hasInventoryItem(global.itemHandler.getItemFromName("Match"),1)){
                return
            }
            this.ignite(player)
        }
        //global.ch.sendToPlayer(player.id,"uievent",{window:"chest",toDisplay:{content:this.content,playerInventory:player.inventory}})
    }
    uiEvent(player,details){
        
    }

}

class DoorBlock extends ActiveBlock{
    constructor(x,y){
        super(x,y)
        this.name = "Door"
        this.currentImage = 60
        this.isOpen = false
        this.isLocked = false
        this.startTime = 0
        // 58,59
    }
    update(now){
        if(!this.isLocked){
            let occupied = false
            for(let p of global.gs.players){
                if(p.calcDistanceFrom(this.pos.x*16,this.pos.y*16)<32){
                    occupied = true
                    break
                }
            }
            if(!this.isOpen && occupied){
                this.openDoor()
            }
            if(this.isOpen && !occupied){
                this.closeDoor()
            }
        }
    }
    openDoor(){
        this.currentImage = 61
        this.imageChanged = true
        this.isOpen = true
    }
    closeDoor(){
        this.currentImage = 60
        this.imageChanged = true
        this.isOpen = false
    }
    interactWith(player){
        this.isLocked = !this.isLocked
        if(this.isLocked){
            this.removable = false
            this.currentImage = 62
            this.imageChanged = true
        }else{
            this.removable = true
            this.openDoor()
        }
    }
    uiEvent(player,details){
        
    }

}

class ActiveBlockHandler{
    constructor(){
        this.currentBlocks = []
        this.activeBlocks = [51,52,53,54,57,58,60]
        this.activeBlockClass = [PlantHelperBlock,PlantHelperBlock,ChestBlock,CampfireBlock,CraftingTableBlock,TNTBlock,DoorBlock]
    }
    placeBlock(x,y,block){
        let ind = this.activeBlocks.indexOf(block)
        if(ind ==-1){
            return
        }
        this.currentBlocks.push(new this.activeBlockClass[ind](x,y))//{x:x,y:y,block:block})

    }
    getActiveBlockAt(x,y){
        for(let i = 0;i<this.currentBlocks.length;i++){
            if(this.currentBlocks[i].pos.x == x && this.currentBlocks[i].pos.y == y){
                return this.currentBlocks[i]
            }
        }
        return null
    }
    removeBlock(x,y){
        for(let i = 0;i<this.currentBlocks.length;i++){
            if(this.currentBlocks[i].pos.x == x && this.currentBlocks[i].pos.y == y){
                this.currentBlocks.splice(i,1)
                return true
            }
        }
        return true
    }
    removeBlockSafely(x,y){
        for(let i = 0;i<this.currentBlocks.length;i++){
            if(this.currentBlocks[i].pos.x == x && this.currentBlocks[i].pos.y == y){
                if(this.currentBlocks[i].removable){
                    this.currentBlocks.splice(i,1)
                }else{
                    return false
                }
            }
        }
        return true
    }
    interactWith(player,x,y){
        for(let i = 0;i<this.currentBlocks.length;i++){
            if(this.currentBlocks[i].pos.x == x && this.currentBlocks[i].pos.y == y){
                this.currentBlocks[i].interactWith(player)
                player.currentActiveBlock = this.currentBlocks[i]
                return
            }
        }
    }
    uiEvent(player,details){
        player.currentActiveBlock.uiEvent(player,details)
    }
    updateActiveBlocks(now){
        // Return true if an update is needed
        let imagesChanged = 0
        for(let i = this.currentBlocks.length-1;i>=0;i--){
            this.currentBlocks[i].update(now)
            if(this.currentBlocks[i] == undefined){
                break
            }
            if(this.currentBlocks[i].selfDestruct){
                global.mapGen.removeBlock(this.currentBlocks[i].pos.x,this.currentBlocks[i].pos.y,null,false,true)
                continue
            }
            if(this.currentBlocks[i].imageChanged){
                imagesChanged++
                global.mapGen.changeBlock(this.currentBlocks[i].pos.x,this.currentBlocks[i].pos.y,this.currentBlocks[i].currentImage)
                this.currentBlocks[i].imageChanged = false
            }
        }
        if(imagesChanged>0){
            return true
        }
        return false

    }
}
module.exports = {
    ActiveBlock,
    PlantHelperBlock,
    CraftingTableBlock,
    ChestBlock,
    CampfireBlock,
    TNTBlock,
    DoorBlock,
    ActiveBlockHandler

}