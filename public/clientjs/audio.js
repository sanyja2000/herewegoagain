class AudioHandler{
    constructor(){
        this.loadedAudio = []
    }
    loadAudio(name,src,volume){
        if(this.loadedAudio.hasOwnProperty(name)){
            console.error("Audio has already been loaded with name: "+name);
            return
        }
        this.loadedAudio[name] = new Audio();
        this.loadedAudio[name].src = src;
        this.loadedAudio[name].volume = volume
    }
    playAudio(name){
        this.loadedAudio[name].currentTime = 0
        this.loadedAudio[name].play()
    }
    playAudioVolume(name,volume){
        this.loadedAudio[name].currentTime = 0
        this.loadedAudio[name].volume = volume
        this.loadedAudio[name].play()
    }
    playServerAudio(data){
        this.playAudioVolume(data.audio,data.volume)
    }
    setLoop(name){
        this.loadedAudio[name].addEventListener('timeupdate', function(){
        var buffer = .44
        if(this.currentTime > this.duration - buffer){
            this.currentTime = 0
            this.play()
        }
    });
    }
    stopAudio(name){
        this.loadedAudio[name].pause()
    }
    loadRequiredSounds(){
        this.loadAudio("pickaxe","sound/pickaxe1.wav",0.2)
        this.loadAudio("placeStuff","sound/placeStuff.wav",0.2)
        this.loadAudio("craftingOpen","sound/craftingOpen.wav",0.2)
        this.loadAudio("tntExplosion","sound/tntExplosion.wav",0.2)
        this.loadAudio("tntActivate","sound/tntActivate.wav",0.2)
    }
}