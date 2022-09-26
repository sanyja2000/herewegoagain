class Player{
    constructor(){
        this.pos = {x:16*20,y:16*10}
        this.id = 0
        this.nextPos = {x:16*20,y:16*10}
        this.vel = {x:0,y:0}
        this.acc = {x:0,y:0}
        this.maxVel = {x:100,y:154}
        this.facing = 0
        this.grounded = false
        this.isMoving = false
        this.solidBlocks = []//[0,2,3,4,5,10,11,12,13,14,15,20,22,23,24,25,30,58,59]
        this.activeBlocks = []//[51,52,53,54,55,56,57,58]
        //this.halfBlocks = [2,3,4,5,12,13,14,15,22,23,24,25]
    }
    teleportPlayer(x,y){
        this.pos = {x:16*x, y:16*y}
        this.nextPos = {x:16*x, y:16*y}
        this.acc = {x:0,y:0}
        this.vel = {x:0,y:0}
    }
    updatePos(dT){
        //if(!this.grounded){
        if(!this.isMoving){
            this.vel.x *= 0.9
        }
        this.acc.y+=400
        //}
        this.vel.x += this.acc.x*dT
        this.vel.y += this.acc.y*dT
        if(Math.abs(this.vel.x)>this.maxVel.x){this.vel.x=Math.sign(this.vel.x)*this.maxVel.x}
        if(Math.abs(this.vel.y)>this.maxVel.y){this.vel.y=Math.sign(this.vel.y)*this.maxVel.y}
        this.nextPos.x += this.vel.x*dT
        this.nextPos.y += this.vel.y*dT
        if(this.vel.x<0){
            this.facing = 0
        }else if(this.vel.x>0){
            this.facing = 1
        }
        this.acc.x = 0
        this.acc.y = 0
    }
    checkCollision(mapData){

        let colTiles = [[this.nextPos.x, this.pos.y],[this.nextPos.x+16, this.pos.y],[this.nextPos.x,this.pos.y+16],[this.nextPos.x+16,this.pos.y+16]]
        if(this.pos.y/16 == Math.floor(this.pos.y/16)){
            colTiles.splice(2,2)
        }
        for(let t of colTiles){
            if(this.solidBlocks.indexOf(mapData.map[mapData.mapWidth*(  Math.floor(t[1]/16)  )+  Math.floor(t[0]/16)  ])>-1){
                if(Math.abs(Math.floor(t[1]/16)*16-this.pos.y)>14){
                    continue
                }
                //this.vel.x = 0
                this.nextPos.x = Math.round(this.pos.x/16)*16
                break
            }
        }

        
        colTiles = [[this.pos.x, this.nextPos.y],[this.pos.x,this.nextPos.y+16],[this.pos.x+16, this.nextPos.y],[this.pos.x+16,this.nextPos.y+16]]
        if(this.pos.x/16 == Math.round(this.pos.x/16)){
            colTiles.splice(2,2)
        }
        for(let t of colTiles){
            if(this.solidBlocks.indexOf(mapData.map[mapData.mapWidth*(Math.floor(t[1]/16))+Math.floor(t[0]/16)])>-1){
                if(Math.abs(Math.floor(t[0]/16)*16-this.pos.x)>14){
                    this.grounded = false
                    continue
                }
                if(this.nextPos.y>this.pos.y){
                    this.grounded = true
                    this.vel.y=0
                }
                if(this.nextPos.y<this.pos.y){
                    this.vel.y = 0
                }
                this.nextPos.y = Math.round(this.pos.y/16)*16
                break
            }
        }
        this.pos.x = this.nextPos.x
        this.pos.y = this.nextPos.y
    }
    handleInput(inputHandler){
        this.isMoving = false
        if(inputHandler.isKeyDown("Space") && this.grounded){
            this.vel.y -= 1000
            this.grounded = false
        }
        if(inputHandler.isKeyDown("KeyA")){
            this.acc.x -= 1000
            this.isMoving = true
        }
        else if(inputHandler.isKeyDown("KeyD")){
            this.acc.x += 1000
            this.isMoving = true
        }

    }
}