const activeBlocks = require('./activeBlocks')
const mobs = require('./mobs')

class MapGenerator{
    constructor(){
        this.noise = require('./perlin')
        this.noise.perlin.seed()
        this.mapHeight = 100
        this.mapWidth = 100
        this.thres = 0.2
        this.abh = new activeBlocks.ActiveBlockHandler()
        this.generateMap()
        this.oreProb = {"red":0.1,"green":0.2,"ice":0.3}
    }
    getMapValue(x,y){
        return this.generatedMapFloat[y*this.mapWidth+x]
    }
    getDoneMapValue(x,y){
        return this.generatedMap[y*this.mapWidth+x]
    }
    removeBlock(x,y,player,noUpdate,unsafe){
        if(x<0 || x>mapGen.mapWidth-1 || y<0 || y>mapGen.mapHeight-1){
            return
        }
        if(mapGen.generatedMap[y*mapGen.mapWidth+x] == 11 || mapGen.generatedMap[y*mapGen.mapWidth+x] == 1){
            return
        }

        if(unsafe){
            this.abh.removeBlock(x,y)
        }else{
            if(!this.abh.removeBlockSafely(x,y)){
                return
            }
        }
        


        let block = global.itemHandler.getBlockFromIcon(mapGen.generatedMap[y*mapGen.mapWidth+x])
        if(block!=null){
            let itemAm = global.itemHandler.getItemAmFromBlockName(block.name)
            if(itemAm != null){
                if(player != null){
                    player.addToInventory(itemAm.item,itemAm.amount)
                }
            }
        }
        
        mapGen.generatedMap[y*mapGen.mapWidth+x] = 1
        if(!noUpdate){
            global.gs.updateMap()
        }
    }
    placeBlock(x,y,block){
        // return true if sucessful
        for(let p of global.gs.players){
            if(Math.round(p.pos.x/16)==x && Math.round(p.pos.y/16)==y){
                return false
            }
        }
        if(mapGen.generatedMap[y*mapGen.mapWidth+x] != 1){
            return false
        }
        mapGen.generatedMap[y*mapGen.mapWidth+x] = block
        this.abh.placeBlock(x,y,block)
        global.gs.updateMap()
        return true
    }
    coverMap(){
        this.coveredMap = []
        for(let y=0;y<this.mapHeight;y++){
            for(let x=0;x<this.mapWidth;x++){
                if(x == 0 || y == 0 || x == this.mapWidth-1 ||y == this.mapHeight-1){
                    this.coveredMap.push(this.getDoneMapValue(x,y))
                    continue
                }
                if(global.itemHandler.solidBlocks.indexOf(this.getDoneMapValue(x,y))>-1){
                    let airBlocks = 0
                    airBlocks += global.itemHandler.solidBlocks.indexOf(this.getDoneMapValue(x-1,y))==-1
                    airBlocks += global.itemHandler.solidBlocks.indexOf(this.getDoneMapValue(x+1,y))==-1
                    airBlocks += global.itemHandler.solidBlocks.indexOf(this.getDoneMapValue(x,y-1))==-1
                    airBlocks += global.itemHandler.solidBlocks.indexOf(this.getDoneMapValue(x,y+1))==-1
                    if(airBlocks==0){
                        this.coveredMap.push(12)
                    }
                    else{
                        this.coveredMap.push(this.getDoneMapValue(x,y))
                    }
                }
                else {
                    this.coveredMap.push(this.getDoneMapValue(x,y))
                }
            }
        }
    }
    changeBlock(x,y,block){
        mapGen.generatedMap[y*mapGen.mapWidth+x] = block
    }
    generateMap(){
        this.treasureProb = []
        this.treasureType = []
        this.generatedMap = []
        this.coveredMap = []
        this.generatedMapFloat = []
        for(let y=0;y<this.mapHeight;y++){
            for(let x=0;x<this.mapWidth;x++){
                let val = this.noise.perlin.get(x/5, y/5)//Math.floor(Math.max((perlin.get(x/10, y/10)+1)/2-0.3,0)*5)
                this.generatedMapFloat.push(val)
                
            }
        }
        for(let y=0;y<this.mapHeight;y++){
            for(let x=0;x<this.mapWidth;x++){
                let val = this.noise.perlin.get(1000+x/5, y/5)//Math.floor(Math.max((perlin.get(x/10, y/10)+1)/2-0.3,0)*5)
                this.treasureProb.push(val)
            }
        }
        for(let y=0;y<this.mapHeight;y++){
            for(let x=0;x<this.mapWidth;x++){
                let val = this.noise.perlin.get(2000+x/20, y/20)//Math.floor(Math.max((perlin.get(x/10, y/10)+1)/2-0.3,0)*5)
                this.treasureType.push(val)
            }
        }
        for(let y=0;y<this.mapHeight;y++){
            for(let x=0;x<this.mapWidth;x++){
                if(x==0 || x == this.mapWidth-1 || y == 0 || y == this.mapHeight-1){
                    this.generatedMap.push(11)
                    continue
                }
                if(x==20 && y == 10){
                    this.generatedMap.push(1)
                    continue
                }
                let val = this.getMapValue(x,y)
                let mod = 0
                if(this.treasureProb[y*this.mapWidth+x]>0.3){
                    if(this.treasureType[y*this.mapWidth+x]<0.1){
                        mod=10
                    }else if(this.treasureType[y*this.mapWidth+x]<0.2){
                        mod=20
                    }else{
                        mod=30
                    }
                }
                if(val>this.thres){
                    
                    if(this.treasureProb[y*this.mapWidth+x]>0.3 && this.getMapValue(x,y+1)<=this.thres){
                        // PLANT
                        this.generatedMap.push(40)
                    }else if(this.treasureProb[y*this.mapWidth+x]>0.1 && this.getMapValue(x,y-1)<=this.thres){
                        // ICICLE
                        this.generatedMap.push(global.itemHandler.getIconFromBlockName("Icicle"))
                    }    
                    else{
                        // AIR
                        this.generatedMap.push(1)
                    }
                }
                else{

                    this.generatedMap.push(0+mod)
                    
                    //this.generatedMap.push(0)
                }
                
            }
        }
        this.coverMap()
    }
    
    generateMobs(mobsArr){
        for(let x=1;x<this.mapWidth-1;x++){
            for(let y=0;x<this.mapHeight-1;y++){    
                // SPAWN SNAIL
                if(global.itemHandler.solidBlocks.indexOf(this.getDoneMapValue(x,y))==-1 && global.itemHandler.solidBlocks.indexOf(this.getDoneMapValue(x,y+1))>-1 &&
                global.itemHandler.solidBlocks.indexOf(this.getDoneMapValue(x+1,y))==-1 && global.itemHandler.solidBlocks.indexOf(this.getDoneMapValue(x+1,y+1))>-1){
                    mobsArr.push(new mobs.SnailMob(x*16,y*16))
                    global.tslog("snail spawned at: "+x+","+y)
                    return
                }
            }
        }
    }
}
module.exports = {
    MapGenerator
}