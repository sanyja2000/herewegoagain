
class ItemHandler{
    constructor(){
        this.items = []
        let fs = require('fs')
        try {
            const data = fs.readFileSync('items.txt', 'utf8');
            let itemid = 0
            for(let line of data.split("\r\n")){
                if(line[0]=="#" || line==""){
                    continue
                }
                let props = line.split(";")
                this.items.push({id:itemid,name:props[0],icon:parseInt(props[1]),stack:parseInt(props[2]),isActive:Boolean(parseInt(props[3]))})
                itemid++
            }
            global.tslog("Loaded "+this.items.length+" items.")
            
        } catch (err) {
            global.tslog(err);
        }
        this.blocks = []
        try {
            const data = fs.readFileSync('blocks.txt', 'utf8');
            let blockid = 0
            for(let line of data.split("\r\n")){
                if(line[0]=="#" || line==""){
                    continue
                }
                let props = line.split(";")
                this.blocks.push({id:blockid,name:props[0],icon:parseInt(props[1]),isSolid:parseInt(props[2]),isActive:parseInt(props[3])})
                blockid++
            }
            global.tslog("Loaded "+this.blocks.length+" blocks.")
            
        } catch (err) {
            global.tslog(err);
        }
        this.blockToItem = []
        try {
            const data = fs.readFileSync('blockToItem.txt', 'utf8');
            for(let line of data.split("\r\n")){
                if(line[0]=="#" || line==""){
                    continue
                }
                let props = line.split(";")
                this.blockToItem.push({blockName:props[0],itemName:props[1],amount:parseInt(props[2]),direction:parseInt(props[3])})
            }
            global.tslog("Loaded "+this.blockToItem.length+" blockToItems.")
            
        } catch (err) {
            global.tslog(err);
        }
        this.craftRecipes = []
        try {
            const data = fs.readFileSync('craftrecipes.txt', 'utf8');
            for(let line of data.split("\r\n")){
                if(line[0]=="#" || line==""){
                    continue
                }
                let props = line.split(";")
                let recipe = {item:this.getItemFromName(props[0]),amount:parseInt(props[1]),ingredients:[]}
                for(let i=1;i<Math.floor(props.length/2);i++){
                    recipe.ingredients.push({itemName:props[i*2],amount:parseInt(props[i*2+1])})
                }
                this.craftRecipes.push(recipe)
            }
            global.tslog("Loaded "+this.craftRecipes.length+" crafting recipes.")
            
        } catch (err) {
            global.tslog(err);
        }
        this.solidBlocks = [12]
        this.activeBlocks = []
        for(let b of this.blocks){
            if(b.isSolid == 1){
                this.solidBlocks.push(b.icon)
            }
            if(b.isActive == 1){
                this.activeBlocks.push(b.icon)
            }
        }
    }
    getRecipeFor(itemName){
        for(let recipe of this.craftRecipes){
            if(recipe.itemName == itemName){
                return recipe
            }
        }
        return null
    }
    getBlockFromIcon(icon){
        for(let block of this.blocks){
            if(block.icon == icon){
                return block
            }
        }
        return null
    }
    getIconFromBlockName(name){
        for(let block of this.blocks){
            if(block.name == name){
                return block.icon
            }
        }
        return 0
    }
    getItemAmFromBlockName(name){
        for(let inter of this.blockToItem){
            if(inter.blockName==name  && (inter.direction == 0 || inter.direction == 1)){
                return {item:this.getItemFromName(inter.itemName),amount:inter.amount} 
            }
        }
        return null
    }
    getBlockFromName(name){
        for(let block of this.blocks){
            if(block.name == name){
                return block
            }
        }
        return null
    }
    getBlockFromItemName(name){
        for(let inter of this.blockToItem){
            if(inter.itemName==name && (inter.direction == 0 || inter.direction == 2)){
                return this.getBlockFromName(inter.blockName) 
            }
        }
        return null
    }
    getItemFromName(name){
        for(let item of this.items){
            if(item.name == name){
                return item
            }
        }
        return null
        //return {id:-1,name:"<undefined>",icon:0,stack:1}
    }
    useActiveItem(player,itemAm){
        if(itemAm.item.name=="Tea"){
            player.changeTemperature(2)
            player.removeFromInventory(itemAm.item,1)
        }
    }
}

module.exports = {
    ItemHandler
}