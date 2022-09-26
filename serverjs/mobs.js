
class Mob{
    constructor(x,y){
        this.pos = {x:x,y:y}
        this.nextPos = {x:x,y:y}
        this.vel = {x:0, y:0}
        this.currentImage = 0
        this.spriteName = "<none>"
    }
    update(){
        return
    }
    getObj(){
        return {pos:this.pos,vel:this.vel,sprite:this.spriteName,curImage:this.currentImage}
    }
    
    // getHit(player)
}

class SnailMob extends Mob{
    constructor(x,y){
        super(x,y)
        this.spriteName = "snail"
        this.animSpeed = 250
        this.maxVelX = 10
        this.currentFrame = 0
        this.currentLine = 0
        this.lastChanged = 0
        this.vel.x = 0.1
    }
    update(){
        if(global.gs.now-this.lastChanged>this.animSpeed){
            if(this.vel.x>0){
                this.currentLine = 0
            }
            if(this.vel.x<0){
                this.currentLine = 1
            }
            this.currentFrame = (this.currentFrame + 1) % 4
            this.currentImage = this.currentFrame+this.currentLine*4
            this.lastChanged=global.gs.now
            
        }
        this.vel.x = Math.max(-Math.abs(this.currentFrame-2)+1,0.1)*Math.sign(this.vel.x)*Math.min(Math.abs(this.vel.x)+1,this.maxVelX)
        //this.vel.x = Math.max(Math.sin((global.gs.now-this.lastChanged)/250*3.14),0.1)*Math.max((this.currentFrame%2),0.1)*Math.sign(this.vel.x)*Math.min(Math.abs(this.vel.x)+1,this.maxVelX)
        if(this.checkCollision()){
            this.vel.x*=-1
            this.lastChanged = 0
        }
        
        this.pos.x+=this.vel.x/60
    }
    checkCollision(){
        let xoff = 0
        if(this.vel.x>0){
            xoff = 16
        }
        let tileX = Math.floor((this.pos.x+xoff+this.vel.x/60)/16)
        let tileY = Math.floor(this.pos.y/16)
        if(global.itemHandler.solidBlocks.indexOf(mapGen.getDoneMapValue(tileX,tileY))>-1){
            return true
        }
        if(global.itemHandler.solidBlocks.indexOf(mapGen.getDoneMapValue(tileX,tileY+1))==-1){
            return true
        }
        
        return false
    }
}

class MobHandler{
    constructor(){
        this.mobs = []
    }
    spawnMob(type,x,y){

    }
}
module.exports={
    SnailMob,
    MobHandler
}