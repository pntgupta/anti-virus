const frame = document.getElementById('snow-bros-frame')
const ctx = frame.getContext('2d')
const FRAME_WIDTH = 500
const FRAME_HEIGHT = 500
const GRAVITY = 0.5

frame.height = FRAME_HEIGHT
frame.width = FRAME_WIDTH

class Throttle {
  constructor(time) {
    this.time = time
    this.isThrottleTimeOver = true
  }

  exec(callback) {
    if (this.isThrottleTimeOver) {
      callback()
      setTimeout(() => { this.isThrottleTimeOver = true }, this.time)
      this.isThrottleTimeOver = false
    }
  }
}

class Shooter {
  constructor(x, y, speedX, maxDistance) {
    this.x = x
    this.y = y
    this.radius = 10
    this.thiness = 0.4
    this.speedX = speedX
    this.dirn = speedX > 0 ? 1 : -1
    this.endX = speedX > 0 ? Math.min(this.x + maxDistance, FRAME_WIDTH - this.radius) : Math.max(this.x - maxDistance, this.radius)
    this.isFinished = false
    
  }

  render() {
    const innerCurveX = this.x + this.thiness * this.radius * this.dirn
    const outerCurveX = this.x + this.radius * this.dirn

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.moveTo(this.x, this.y - this.radius)
    if (!this.isFinished) {
      // small curve
      ctx.bezierCurveTo(innerCurveX, this.y - this.radius, innerCurveX, this.y + this.radius, this.x, this.y + this.radius)
      // Bigger curve, starting from where above curve ended
      ctx.bezierCurveTo(outerCurveX, this.y + this.radius / 2, outerCurveX, this.y - this.radius / 2, this.x, this.y - this.radius)
    } else {
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    }
    ctx.fill()
  }

  update() {
    if ((this.dirn === 1 && this.x >= this.endX) || (this.dirn === -1 && this.x <= this.endX)) {
      this.isFinished = true
    } else {
      this.x += this.speedX
    }
  }
}

class Player {
  constructor() {
    this.height = 50
    this.width = 30
    this.x = 20
    this.y = FRAME_HEIGHT - this.height
    this.speedX = 3
    this.speedY = GRAVITY
    this.jumpDistance = 10
    this.dy = 0
    this.atRest = true
    this.firingSpeed = 5
    this.firingDistance = 25
    // 1 for right, -1 for left
    this.playerDirn = 1
    this.activeKeys = {}
    this.shooterSpeed = 5
    this.shooterMaxDistance = 200
    this.activeShooters = []
    this.throttle = new Throttle(200)
    this._attachListeners()
  }


  render() {
    ctx.fillStyle = 'white'
    ctx.fillRect(this.x, this.y, this.width, this.height)
    this._renderShooters()
  }

  update() {
    this._updateHorizontalMovement()
    this._updateVerticalMovement()
    this._updateShooters()
  }

  _updateHorizontalMovement() {
    // Left arrow
    if (this.activeKeys[37]) {
      this.playerDirn = -1
      this.x = Math.max(this.x - this.speedX, 0)
    }
    // Right arrow
    else if (this.activeKeys[39]) {
      this.playerDirn = 1
      this.x = Math.min(this.x + this.speedX, FRAME_WIDTH - this.width)
    }
  }
  _updateVerticalMovement() {
    if (this.atRest) {
      // Top arrow
      if (this.activeKeys[38]) {
        this.dy = -this.jumpDistance
        this.atRest = false
      }
    } else {
      this.y += this.dy
      this.dy += this.speedY
      if (this.y >= FRAME_HEIGHT - this.height) {
        this.y = FRAME_HEIGHT - this.height
        this.atRest = true
      }
    }
  }
  _updateShooters() {
    // Spacebar
    if (this.activeKeys[32]) {
      this.throttle.exec(() => this.activeShooters.push(new Shooter(this.playerDirn > 1 ? this.x + this.width : this.x, this.y + this.height / 2, this.playerDirn * this.shooterSpeed, this.shooterMaxDistance)))
    }

    for (let i = 0; i < this.activeShooters.length; i++) {
      const shooter = this.activeShooters[i]
      if (shooter.isFinished) {
        this.activeShooters.splice(i, 1)
        i--
      } else {
        shooter.update()
      }
    }
  }
  _renderShooters() {
    this.activeShooters.forEach(shooter => shooter.render())
  }
  _onkeydown(e) {
    e.preventDefault()
    this.activeKeys[e.keyCode] = true
  }
  _onkeyup(e) {
    e.preventDefault()
    this.activeKeys[e.keyCode] = false
  }
  _attachListeners() {
    document.addEventListener('keydown', (e) => this._onkeydown(e))
    document.addEventListener('keyup', (e) => this._onkeyup(e))
  }
}

class Background {
  render() {
    ctx.fillStyle = `hsl(${Date.now() / 50}, 50%, 50%)`
    ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT)
  }
}

class Stage {
  constructor() {
    this.player = new Player()

    this.platformHeight = 30
    this.playerJumpDistance = 10
    this.platformDistance = this.player.height + this.platformHeight + this.playerJumpDistance

    this.level1Y = FRAME_HEIGHT - this.platformDistance
    this.level2Y = this.level1Y - this.platformDistance
    this.level3Y = this.level2Y - this.platformDistance
    this.level4Y = this.level3Y - this.platformDistance

    this.platformsConfig = [
      {
        x: 250,
        y: FRAME_HEIGHT - 30,
        height: this.platformHeight,
        width: 50
      },
      {
        x: 0,
        y: this.level1Y,
        height: this.platformHeight,
        width: FRAME_WIDTH * 0.25
      },
      {
        x: FRAME_WIDTH * 0.4,
        y: this.level1Y,
        height: this.platformHeight,
        width: FRAME_WIDTH * 0.2
      },
      {
        x: FRAME_WIDTH * 0.75,
        y: this.level1Y,
        height: this.platformHeight,
        width: FRAME_WIDTH
      },
      {
        x: FRAME_WIDTH * 0.2,
        y: this.level2Y,
        height: this.platformHeight,
        width: FRAME_WIDTH * 0.6
      },
      {
        x: 0,
        y: this.level3Y,
        height: this.platformHeight,
        width: FRAME_WIDTH * 0.35
      },
      {
        x: FRAME_WIDTH * 0.65,
        y: this.level3Y,
        height: this.platformHeight,
        width: FRAME_WIDTH
      },
      {
        x: FRAME_WIDTH * 0.1,
        y: this.level4Y,
        height: this.platformHeight,
        width: FRAME_WIDTH * 0.1
      }, {
        x: FRAME_WIDTH * 0.8,
        y: this.level4Y,
        height: this.platformHeight,
        width: FRAME_WIDTH * 0.1
      },
      {
        x: FRAME_WIDTH * 0.2,
        y: this.level4Y - this.platformHeight,
        height: this.platformHeight,
        width: FRAME_WIDTH * 0.6
      }
    ]

    this.platformInstances = this.platformsConfig.map(config => new Platform(config))
  }

  render() {
    // We may want to add some UI on existing platforms, thus render platform 1st and then UI
    this.platformInstances.forEach(platform => platform.render())
    this._renderStageUI()
    this.player.render()
  }

  update() {
    this.player.update()

    const playerBottomY = this.player.y + this.player.height
    const isAtBottom = playerBottomY >= FRAME_HEIGHT
    let isOnPlatform = false

    for (let platform of this.platformInstances) {
      const isJustOnPlatformY = playerBottomY < platform.y + (platform.height * 0.3) && playerBottomY >= platform.y
      const isOnPlatformX = this.player.x + this.player.width > platform.x && (this.player.x < platform.x + platform.width)
      
      this._preventPlayerOrShooterToPassPlatform(this.player, platform)
      this.player.activeShooters.forEach(shooter => {
        // We have to provide coordinated which consider as collision, in this case center coordinates. In case shooter going right to right. ')' -> func will add the width so we need to pre decrement it.
        shooter.isFinished = shooter.isFinished || this._preventPlayerOrShooterToPassPlatform({ x: shooter.dirn === 1 ? shooter.x - shooter.radius : shooter.x, y: shooter.y - shooter.radius, width: shooter.radius, height: shooter.radius * 2 }, platform)
      })
      // For jumping on platform
      // If Players bottom comes between platform and player is going down, we have to allow player going up, then set player to rest
      if (this.player.dy >= 0 && isOnPlatformX && isJustOnPlatformY) {
        // Setting player position to top of platform to avoid minor pixel errors
        this.player.y = platform.y - this.player.height
        this.player.atRest = true
        this.player.dy = 0
        isOnPlatform = true
        // Don't return as more conditions may also fulfill like it may be on edge of another platform
      }
    }

    if (!isOnPlatform && !isAtBottom) {
      // Player is not on any platform, drop him
      this.player.atRest = false
    }
  }

  _preventPlayerOrShooterToPassPlatform(obj, platform) {
    const bottomY = obj.y + obj.height
    const isInsidePlatformY = (obj.y > platform.y && obj.y < platform.y + platform.height) ||
    (bottomY <= platform.y + platform.height && bottomY > platform.y)
    const isOnLeftSideEdges = obj.x + obj.width >= platform.x && obj.x + obj.width <= platform.x + 10
    const isOnRightSideEdges = obj.x < platform.x + platform.width && obj.x > platform.x + platform.width - 10
    let isCollision = false

    if (isInsidePlatformY) {
      if (isOnLeftSideEdges) {debugger
        obj.x = platform.x - obj.width
        isCollision = true
      } else if (isOnRightSideEdges) {debugger
        obj.x = platform.x + platform.width
        isCollision = true
      }
    }

    return isCollision
  }

  _renderStageUI() {
    ctx.fillStyle = 'grey'
    ctx.fillRect(FRAME_WIDTH * 0.1, this.level4Y, FRAME_WIDTH * 0.8, this.platformHeight)
  }
}

class Platform {
  constructor({ x, y, height, width }) {
    this.x = x
    this.y = y
    this.height = height
    this.width = width
  }

  render() {
    ctx.fillStyle = 'grey'
    ctx.fillRect(this.x, this.y, this.width, this.height)
  }
}

class SnowBros {
  constructor() {
    this.background = new Background()
    this.stage = new Stage()
  }
  update() {
    this.stage.update()
  }
  render() {
    this.background.render()
    this.stage.render()
  }
  loop() {
    this.update()
    this.render()
    requestAnimationFrame(() => this.loop())
  }
  start() {
    this.loop()
  }
}

new SnowBros().start()
