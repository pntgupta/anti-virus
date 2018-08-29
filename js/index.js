const ctx = document.getElementById('snow-bros-frame').getContext('2d')
const FRAME_WIDTH = 1000;
const FRAME_HEIGHT = 500;
const GRAVITY = 0.5;

class Player {
    constructor() {
        this.height = 50
        this.width = 30
        this.x = 20
        this.y = FRAME_HEIGHT - this.height
        this.speedX = 3;
        this.speedY = GRAVITY;
        this.jumpDistance = 10;
        this.dy = 0;
        this.atRest = true;
        this.activeKeys = {}

        this._attachListeners()
    }

    render() {
        ctx.fillStyle = 'white'
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }

    update() {
        // Left arrow
        if (this.activeKeys[37]) {
            this.x = Math.max(this.x - this.speedX, 0)
        }
        // Right arrow
        else if (this.activeKeys[39]) {
            this.x = Math.min(this.x + this.speedX, FRAME_WIDTH - this.width)
        }

        if (this.atRest) {
            // Top arrow
            if (this.activeKeys[38]) {
                this.dy = -this.jumpDistance
                this.atRest = false
            }
        } else {
            this.y += this.dy;
            this.dy += this.speedY;
            if (this.y >= FRAME_HEIGHT - this.height) {
                this.y = FRAME_HEIGHT - this.height
                this.atRest = true
            }
        }

    }
    _onkeydown(e) {
        e.preventDefault();
        this.activeKeys[e.keyCode] = true;
    }
    _onkeyup(e) {
        e.preventDefault();
        this.activeKeys[e.keyCode] = false;
    }
    _attachListeners() {
        document.addEventListener('keydown', (e) => this._onkeydown(e))
        document.addEventListener('keyup', (e) => this._onkeyup(e))
    }
}

class Background {
    render() {
        ctx.fillStyle = `hsl(${ Date.now()/50 }, 50%, 50%)`
        ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT)
    }
}

class SnowBros {
    constructor() {
        this.background = new Background()
        this.player = new Player()
    }
    update() {
        this.player.update();
    }
    render() {
        this.background.render();
        this.player.render()
    }
    loop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop())
    }
    start() {
        this.loop();
    }
}

new SnowBros().start()
