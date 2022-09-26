class SpriteRenderer{
    constructor(renderctx) {
        this.sprites = {}
        this.ctx = renderctx
        this.spriteUpdateTime = 250
        this.lastUpdated = 0
        this.loadRequiredSprites()
    }
    loadSprite(name, src, w){
        let img = new Image();
        img.src = src;
        this.sprites[name] = {image:img, width:w, cFrame:0, cLine:0, looping:false,visible:true}
    }
    loadRequiredSprites(){
        this.loadSprite("char1","img/char1.png",16)
        this.loadSprite("pickaxe","img/pickaxe.png",8)
        this.loadSprite("snail","img/snail1.png",16)
    }
    displaySprite(name,x,y,zoomLvl){
        let spr = this.sprites[name]
        if(!spr.visible){
            return
        }
        this.ctx.drawImage(spr.image,spr.cFrame*spr.width,spr.cLine*spr.width,spr.width,spr.width,x,y,spr.width*zoomLvl,spr.width*zoomLvl)
    }
    setCurrentFrame(name,frame){
        this.sprites[name].cFrame = frame
    }
    setCurrentLine(name,line){
        this.sprites[name].cLine = line
    }
    setCurrentImage(name,n){
        let x = n%(this.sprites[name].image.width/this.sprites[name].width)
        let y = Math.floor(n/(this.sprites[name].image.width/this.sprites[name].width))
        this.setCurrentFrame(name,x)
        this.setCurrentLine(name,y)
        //console.log()
    }
    startAnim(name){
        this.sprites[name].visible = true
    }
    updateAllSprites(now){
        if(now-this.lastUpdated<this.spriteUpdateTime){
            return
        }
        this.lastUpdated = now
        for(var spr in this.sprites){
        //ASDASD
        break
        }
        this.updateSprite("char1")
        this.updateSprite("pickaxe")
    }
    updateSprite(name){
        if(!this.sprites[name].visible){
            return
        }
        this.sprites[name].cFrame++
        if(this.sprites[name].cFrame>3){
            this.sprites[name].cFrame = 0
            if(!this.sprites[name].looping){
                this.sprites[name].visible = false
            }
        }
    }
    
}

class FPSCounter{
    constructor(){
        this.frametimes = []
        this.deltaTime = 1

        this.currentTime = Date.now()
        this.frametimes.push(this.currentTime)
    }
    update(){
        this.currentTime = Date.now()
        let now = this.currentTime
        for(let i=this.frametimes.length-1;i>=0;i--){
            if(now-this.frametimes[i]>1000){
                this.frametimes.splice(i,1)
                i--
            }
        }
        this.deltaTime = (now-this.frametimes[this.frametimes.length-1])/1000
        if(this.deltaTime>0.1){
            this.deltaTime = 0.09
        }
        
        this.frametimes.push(now)
    }
    getFPS(){
        return this.frametimes.length
    }
    getDT(){
        return this.deltaTime
    }
}

class ParticleSystem{
    constructor(){
        this.particles = []
    }
    update(){

    }
    addParticles(x,y,c){
        for(let i=0;i<20;i++){
            let vel = Math.random()*10;
            let ang = Math.random()*Math.PI/3*2+Math.PI/6;
            this.particles.push({x:x,y:y,vx:Math.cos(ang)*vel,vy:-Math.sin(ang)*vel,c:c,l:50});
        }
    }
    updateParticles(){
        for(var p=this.particles.length-1;p>=0;p--){
            this.particles[p].l-=1;
            if(this.particles[p].l<0){
                this.particles.splice(p,1);
                p--;
                continue
            }
            this.particles[p].x += this.particles[p].vx;
            this.particles[p].vy += 1;
            this.particles[p].y += this.particles[p].vy;
        }
    }
    drawParticles(){
        ctx.strokeStyle = "black"
        for(var p of this.particles){
            ctx.fillStyle = c
            ctx.fillRect(p.x,p.y,10*p.l/50,10*p.l/50);
            ctx.strokeRect(p.x,p.y,10*p.l/50,10*p.l/50);
        }
    }
}


class Renderer{
    constructor(){
        this.canvas = document.getElementById("myCanvas")
        this.canvas.width = WIDTH
        this.canvas.height = HEIGHT
        
        this.zoomLevel = 4
        //this.canvas.width = window.innerWidth
        //this.canvas.height = window.innerHeight
        this.canvas.style.width = window.innerWidth+"px"
        this.canvas.style.height = window.innerHeight+"px"
        this.ctx = this.canvas.getContext("2d")
        this.ctx.imageSmoothingEnabled = false
        this.atlasImg = new Image()
        this.atlasImg.src = "img/atlas.png"
        this.itemImg = new Image()
        this.itemImg.src = "img/items.png"
        this.camera = {x:0,y:0,fixed:true}
        this.spriteRenderer = new SpriteRenderer(this.ctx)
        this.spriteRenderer.loadRequiredSprites()
        this.spriteRenderer.sprites["char1"].looping = true
        this.uiHandler = new UIHandler()
        this.screenShake = {x:0,y:0}
    }
    documentResize(){
        WIDTH = window.innerWidth
        HEIGHT = window.innerHeight
        this.canvas.width = WIDTH
        this.canvas.height = HEIGHT
        this.canvas.style.width = window.innerWidth+"px"
        this.canvas.style.height = window.innerHeight+"px"
        this.ctx.imageSmoothingEnabled = false
    }
    getPixelColAt(x,y){
        let pc = this.ctx.getImageData(x, y, 1, 1).data
        return "rgb("+pc[0]+","+pc[1]+","+pc[2]+")";
    }
    clearBg(){
        /*this.bgGrad = this.ctx.createLinearGradient(0,0,0,HEIGHT)
        this.bgGrad.addColorStop(0, "hsl(190, 76%, "+(100-(this.camera.y)/16)*0.5+"%)");
        this.bgGrad.addColorStop(1, "hsl(190, 76%, "+(100-(this.camera.y+HEIGHT)/16)*0.5+"%)");
        this.ctx.fillStyle = this.bgGrad//"#666"
        */
        this.ctx.fillStyle = "#666"
        this.ctx.fillRect(0,0,WIDTH,HEIGHT)
    }
    showNoise(dx,dy){
        this.ctx.fillStyle = "rgba(0,0,0,"+(this.treasureType[dy*this.mapWidth+dx]+1)/2+")"
        this.ctx.fillRect(dx*16,dy*16,16,16);
    }
    updateScreenShake(){
        
        if(Math.abs(this.screenShake.x)>0.1){
            this.screenShake.x*=0.95
        }else{
            this.screenShake.x = 0
        }
        if(Math.abs(this.screenShake.y)>0.1){
            this.screenShake.y*=0.95
        }else{
            this.screenShake.y = 0
        }
    }
    renderBg(dx,dy){
        if(dx<-16 || dx>WIDTH+16 || dy<-16 || dy > HEIGHT+16){
            return
        }
        this.ctx.fillStyle = "rgba(0,0,0,"+(1-dy/this.mapHeight)*0.8+")"
        this.ctx.fillRect(dx*16,dy*16,16,16);
    }
    renderAtlas(dx,dy,id){
        if(dx<-16 || dx>WIDTH+16 || dy<-16 || dy > HEIGHT+16){
            return
        }
        let x = id%10
        let y = Math.floor(id/10)
        this.ctx.drawImage(this.atlasImg,x*16,y*16,16,16,dx*this.zoomLevel,dy*this.zoomLevel,16*this.zoomLevel,16*this.zoomLevel)
    }
    renderItem(dx,dy,id){
        if(dx<-16 || dx>WIDTH+16 || dy<-16 || dy > HEIGHT+16){
            return
        }
        let x = id%10
        let y = Math.floor(id/10)
        this.ctx.drawImage(this.itemImg,x*16,y*16,16,16,dx*this.zoomLevel,dy*this.zoomLevel,16*this.zoomLevel,16*this.zoomLevel)
    }
    renderPlayer(player){
        this.ctx.textAlign = "center"
        this.ctx.font = "10px Arial"
        this.ctx.fillStyle = "white"
        
        let animLine = 0

        if(player.facing==1){
            animLine = 0
        }
        if(player.facing==0){
            animLine = 1
        }
        if(Math.abs(player.vel.x)>1){
            animLine+=2
        }
        this.spriteRenderer.setCurrentLine("char1",animLine)
        //this.spriteRenderer.displaySprite("char1",Math.floor(player.pos.x-this.camera.x)*this.zoomLevel,Math.floor(player.pos.y-this.camera.y)*this.zoomLevel,this.zoomLevel)
        
        this.spriteRenderer.displaySprite("char1",(player.pos.x-this.camera.x)*this.zoomLevel,(player.pos.y-this.camera.y)*this.zoomLevel,this.zoomLevel)
        this.spriteRenderer.displaySprite("pickaxe",(player.pos.x-this.camera.x)*this.zoomLevel,(player.pos.y-this.camera.y+8)*this.zoomLevel,this.zoomLevel)
        this.ctx.fillText((""+player.id).substr(0,10),(player.pos.x-this.camera.x+8)*this.zoomLevel,(player.pos.y-this.camera.y)*this.zoomLevel)
    }
    renderMob(mob){
        this.spriteRenderer.setCurrentImage("snail",mob.curImage)
        this.spriteRenderer.displaySprite("snail",(mob.pos.x-this.camera.x)*this.zoomLevel,(mob.pos.y-this.camera.y)*this.zoomLevel,this.zoomLevel)
        //console.log(mob.curImage)
    }
    render(mapData,player,otherPlayers,mobs){
        this.clearBg()
        this.updateScreenShake()
        
        for(let y=0;y<mapData.mapHeight;y++){
            for(let x=0;x<mapData.mapWidth;x++){
                //this.showNoise(x,y)
                //this.renderAtlas(Math.floor(x*16-this.camera.x),Math.floor(y*16-this.camera.y),mapData.map[y*mapData.mapWidth+x])
                //this.renderBg(x,y)
                this.renderAtlas(Math.floor((x*16-this.camera.x+this.screenShake.x)*this.zoomLevel)/this.zoomLevel,Math.floor((y*16-this.camera.y+this.screenShake.y)*this.zoomLevel)/this.zoomLevel,mapData.map[y*mapData.mapWidth+x])
                //this.renderAtlas(x*16-this.camera.x,y*16-this.camera.y,mapData.map[y*mapData.mapWidth+x])
            
            }
        }
        for(let op of otherPlayers){
            if(op.id == player.id){continue}
            this.renderPlayer(op)
        }
        for(let mob of mobs){
            this.renderMob(mob)
        }
        this.renderPlayer(player)
    }
    renderBox(mouse,player){
        this.ctx.strokeStyle = "white"
        this.ctx.setLineDash([15, 5]);

        
        let angle = Math.atan2(mouse.y-HEIGHT/2-this.zoomLevel*8,mouse.x-WIDTH/2+this.zoomLevel*8)
        
        let dist = Math.sqrt(Math.pow(mouse.y-HEIGHT/2-this.zoomLevel*8,2)+Math.pow(mouse.x-WIDTH/2+this.zoomLevel*8,2))/(16*this.zoomLevel)

        
        let xoff = Math.round(Math.cos(angle))//*dist
        let yoff = Math.round(Math.sin(angle))//*dist
        if(dist<0.5){
            xoff = 0
            yoff = 0   
        }
        /*
        if(dist > 2){
            game.inputHandler.currentTile = undefined
            return
        }*/
        
        let x = (Math.round(player.pos.x/16+xoff)*16-this.camera.x)*this.zoomLevel
        let y = (Math.round(player.pos.y/16+yoff)*16-this.camera.y)*this.zoomLevel
        
        // TODO: JUNK PLS DELETE
        game.inputHandler.currentTile = {x:(Math.round(player.pos.x/16+xoff)*16)/16,y:(Math.round(player.pos.y/16+yoff)*16)/16}

        this.ctx.strokeRect(x ,y,this.zoomLevel*16,this.zoomLevel*16)
        //console.log(mouse)
    }
}