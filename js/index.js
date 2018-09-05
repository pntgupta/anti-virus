const frame = document.getElementById('snow-bros-frame')
const ctx = frame.getContext('2d')
const FRAME_WIDTH = 500
const FRAME_HEIGHT = 500
const GRAVITY = 0.5

frame.height = FRAME_HEIGHT
frame.width = FRAME_WIDTH

const Utils = {
  isCollision(obj1, obj2) {
    return obj1.x <= obj2.x + obj2.width &&
      obj1.x + obj1.width >= obj2.x &&
      obj1.y <= obj2.y + obj2.height &&
      obj1.y + obj1.height >= obj2.y
  }
}

class Throttle {
  constructor(time, { immediate } = {}) {
    this.time = time
    this.immediate = typeof immediate === 'undefined' ? true : immediate
    this.isThrottleTimeOver = true
  }

  exec(callback) {
    if (this.isThrottleTimeOver) {
      this.immediate && callback()
      setTimeout(() => {
        this.isThrottleTimeOver = true
        !this.immediate && callback()
      }, this.time)
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
  constructor({ height = 50, width = 30, x = 20, y = FRAME_HEIGHT - height }) {
    this.height = height
    this.width = width
    this.x = x
    this.y = y
    this.speedX = 3
    this.speedY = GRAVITY
    this.maxSpeedY = 10
    this.jumpDistance = 10
    this.dy = 0
    this.atRestY = true
    this.dirn = 1
    this.activeKeys = {}
    this.shooterSpeed = 5
    this.shooterMaxDistance = 200
    this.activeShooters = []
    this.throttle = new Throttle(400)
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
      this.dirn = -1
      this.x = Math.max(this.x - this.speedX, 0)
    }
    // Right arrow
    else if (this.activeKeys[39]) {
      this.dirn = 1
      this.x = Math.min(this.x + this.speedX, FRAME_WIDTH - this.width)
    }
  }
  _updateVerticalMovement() {
    if (this.atRestY) {
      // Top arrow
      if (this.activeKeys[38]) {
        this.dy = -this.jumpDistance
        this.atRestY = false
      }
    } else {
      this.y += this.dy
      this.dy = Math.min(this.dy + this.speedY, this.maxSpeedY)
      if (this.y >= FRAME_HEIGHT - this.height) {
        this.y = FRAME_HEIGHT - this.height
        this.atRestY = true
      }
    }
  }
  _updateShooters() {
    // Spacebar
    if (this.activeKeys[32]) {
      this.throttle.exec(() => this.activeShooters.push(new Shooter(this.dirn > 1 ? this.x + this.width : this.x, this.y + this.height / 2, this.dirn * this.shooterSpeed, this.shooterMaxDistance)))
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

class Opponent {
  constructor({ x, y = 0, height = 50, width = 40 }) {
    this.x = x
    this.y = y
    this.height = height
    this.width = width
    this.maxSpeedX = 2
    this.speedX = this.maxSpeedX
    this.speedY = GRAVITY
    this.maxSpeedY = 10
    this.dy = 0
    this.jumpDistance = 10
    this.dirn = Math.random() >= 0.5 ? 1 : -1
    this.atRestY = false
    this.atRestX = false
    this.throttle = new Throttle(500, { immediate: false })
    this.jumpProbability = 0.004
    this.jumpFromEdgeProbability = 0.1
    this.returnBackFromEdgeProbability = 0.7
    this.freeFallFromEdgeProbability = 0.2
    this.hits = 0
    this.maxHits = 6
    this.timeToRevertHit = 3000
    this._interval
  }

  render() {
    const nonHitsRatio = (this.maxHits - this.hits)/this.maxHits
    ctx.fillStyle = 'black'
    ctx.fillRect(this.x, this.y, this.width, this.height * nonHitsRatio)
    ctx.fillStyle = 'blue'
    ctx.fillRect(this.x, this.y + this.height * nonHitsRatio, this.width, this.height * (1 - nonHitsRatio))
  }
  update() {
    this._updateHorizontalMovement()
    this._updateVerticalMovement()
  }

  jump() {
    this.dy = -this.jumpDistance
    this.atRestY = false
  }

  hit() {
    this.hits++
    this._updateSpeedX()
    clearInterval(this._interval)

    // Constantly reduce the hits 
    this._interval = setInterval(() => {
      if (this.hits === 0) {
        clearInterval(this._interval)
      } else {
        this.hits--
        this._updateSpeedX()
      }
    }, this.timeToRevertHit)
  }

  _updateSpeedX() {
    this.speedX = this.maxSpeedX * (this.maxHits - this.hits) / this.maxHits
  }

  _updateHorizontalMovement() {
    if (this.atRestX) {
      this.throttle.exec(() => this._reverseDirn())
    } else {
      this.x = Math.max(Math.min(this.x + this.speedX * this.dirn, FRAME_WIDTH - this.width), 0)
    }
    if (this.x === 0 || this.x + this.width === FRAME_WIDTH) {
      this.atRestX = true
    }
  }

  _updateVerticalMovement() {
    if (this.atRestY) {
      if (Math.random() < this.jumpProbability) {
        this.jump()
      }
    } else {
      this.y += this.speedY
      this.y += this.dy
      this.dy = Math.min(this.dy + this.speedY, this.maxSpeedY)
      if (this.y >= FRAME_HEIGHT - this.height) {
        this.y = FRAME_HEIGHT - this.height
        this.atRestY = true
      }
    }
  }

  _reverseDirn() {
    this.dirn *= -1
    this.atRestX = false
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
    this.player = new Player({})

    this.platformHeight = 30
    this.playerJumpDistance = 10
    this.platformDistance = this.player.height + this.platformHeight + this.playerJumpDistance

    this.level1Y = FRAME_HEIGHT - this.platformDistance
    this.level2Y = this.level1Y - this.platformDistance
    this.level3Y = this.level2Y - this.platformDistance
    this.level4Y = this.level3Y - this.platformDistance

    this.platformsConfig = [
      {
        x: 0,
        y: FRAME_HEIGHT,
        width: FRAME_WIDTH
      },
      {
        x: 0,
        y: this.level1Y,
        width: FRAME_WIDTH * 0.25
      },
      {
        x: FRAME_WIDTH * 0.4,
        y: this.level1Y,
        width: FRAME_WIDTH * 0.2
      },
      {
        x: FRAME_WIDTH * 0.75,
        y: this.level1Y,
        width: FRAME_WIDTH
      },
      {
        x: FRAME_WIDTH * 0.2,
        y: this.level2Y,
        width: FRAME_WIDTH * 0.6
      },
      {
        x: 0,
        y: this.level3Y,
        width: FRAME_WIDTH * 0.35
      },
      {
        x: FRAME_WIDTH * 0.65,
        y: this.level3Y,
        width: FRAME_WIDTH
      },
      {
        x: FRAME_WIDTH * 0.1,
        y: this.level4Y,
        width: FRAME_WIDTH * 0.2
      },
      {
        x: FRAME_WIDTH * 0.7,
        y: this.level4Y,
        width: FRAME_WIDTH * 0.2
      },
      {
        x: FRAME_WIDTH * 0.3,
        y: this.level4Y - this.platformHeight,
        width: FRAME_WIDTH * 0.4
      }
    ]

    this.opponentsConfig = [
      {
        x: 0,
        y: 100
      },
      {
        x: 100
      },
      {
        x: 300
      },
      {
        x: 400
      },
      {
        x: 450,
        y: 100
      },
      {
        x: 350,
        y: 200
      },
      {
        x: 100,
        y: 300
      },
      {
        x: 400,
        y: 300
      }
    ]
    this.platformInstances = this.platformsConfig.map(config => new Platform(config))
    this.opponents = this.opponentsConfig.map(config => new Opponent(config))
    this.isGameOver = false
  }

  render() {
    // We may want to add some UI on existing platforms, thus render platform 1st and then UI
    this.platformInstances.forEach(platform => platform.render())
    this._renderStageUI()
    this.player.render()
    this.opponents.forEach(opponent => opponent.render())
  }

  update() {
    if (!this.isGameOver) {
      this.player.update()
      for (let i = 0; i < this.opponents.length; i++) {
        const opponent = this.opponents[i]
        if (opponent.hits >= opponent.maxHits) {
          this.opponents.splice(i, 1)
          i--
        } else {
          opponent.update()
        }
      }
      this._detectPlayerAndOpponentCollision()

      // Reset atRestY so that if object is not on any platform, we can freefall it.
      this.player.atRestY = false
      this.opponents.forEach((opponent, index) => {
        opponent.atRestY = false
        for (let i = index + 1; i < this.opponents.length; i++) {
          const otherOpponent = this.opponents[i]
          if ((opponent.x < otherOpponent.x ? opponent.dirn === 1 && otherOpponent.dirn === -1 : opponent.dirn === -1 && otherOpponent.dirn === 1) && Utils.isCollision(opponent, otherOpponent)) {
            opponent.atRestX = otherOpponent.atRestX = true;
          }
        }
      })

      
      for (let platform of this.platformInstances) {

        // Player
        this._isPassingThroughPlatformSides(this.player, platform)
        this.player.atRestY = this.player.atRestY || this._isJumpingOnPlatform(this.player, platform)

        // Shooter
        this.player.activeShooters.forEach(shooter => {
          // We have to provide coordinate which consider as collision, in this case center coordinates. In case shooter going right to right. ')' -> func will add the width so we need to pre decrement it.
          shooter.isFinished = shooter.isFinished || this._isPassingThroughPlatformSides({ x: shooter.dirn === 1 ? shooter.x - shooter.radius : shooter.x, y: shooter.y - shooter.radius, width: shooter.radius, height: shooter.radius * 2 }, platform)
        })

        // Opponents
        this.opponents.forEach(opponent => {
          this._randomizeEdgeMoment(opponent, platform)
          opponent.atRestX = opponent.atRestX || this._isPassingThroughPlatformSides(opponent, platform)
          opponent.atRestY = opponent.atRestY || this._isJumpingOnPlatform(opponent, platform)
        })
      }
    }
  }

  // Prevent passing through left and right edges of platform
  _isPassingThroughPlatformSides(obj, platform) {
    const bottomY = obj.y + obj.height
    const isInsidePlatformY = (obj.y > platform.y && obj.y < platform.y + platform.height) ||
    (bottomY <= platform.y + platform.height && bottomY > platform.y)
    const isOnLeftSideEdges = obj.x + obj.width >= platform.x && obj.x + obj.width <= platform.x + 10
    const isOnRightSideEdges = obj.x <= platform.x + platform.width && obj.x >= platform.x + platform.width - 10
    let isCollision = false

    if (isInsidePlatformY) {
      if (isOnLeftSideEdges) {
        obj.x = platform.x - obj.width
        isCollision = true
      } else if (isOnRightSideEdges) {
        obj.x = platform.x + platform.width
        isCollision = true
      }
    }

    return isCollision
  }

  _isJumpingOnPlatform(obj, platform) {
    const isJustOnPlatformY = obj.y + obj.height <= platform.y + obj.maxSpeedY - 1 && obj.y + obj.height >= platform.y
    const isOnPlatformX = obj.x + obj.width > platform.x && (obj.x < platform.x + platform.width)

    // If Object's bottom comes between platform and object is going down (we have to allow it going up), then set object to rest
    if (obj.dy >= 0 && isOnPlatformX && isJustOnPlatformY) {
      // Setting player position to top of platform to avoid minor pixel errors
      obj.y = platform.y - obj.height
      obj.atRestY = true
      obj.dy = 0
      return true
    }
  }

  _randomizeEdgeMoment(obj, platform) {
    const isOnPlatformY = obj.y + obj.height === platform.y
    const isOnLeftSideEdges = obj.x >= platform.x && obj.x <= platform.x + obj.speedX - 1
    const isOnRightSideEdges = obj.x + obj.width >= platform.x + platform.width && obj.x + obj.width <= platform.x + platform.width + obj.speedX - 1

    if (!obj.atRestX && isOnPlatformY && (isOnLeftSideEdges && obj.dirn === -1 || isOnRightSideEdges && obj.dirn === 1)) {
      const random = Math.random()
      if (random < obj.jumpFromEdgeProbability) {
        obj.jump()
      } else if (random < obj.returnBackFromEdgeProbability) {
        obj.atRestX = true
      }
    }
  }

  _detectPlayerAndOpponentCollision() {
    this.opponents.some(opponent => {
      if (Utils.isCollision(this.player, opponent)) {
        this._gameOver()
        return true
      }
      
      this.player.activeShooters.forEach(shooter => {
        const isHit = Utils.isCollision({ x: shooter.dirn === 1 ? shooter.x : shooter.x - shooter.radius, y: shooter.y - shooter.radius, width: shooter.radius, height: shooter.radius * 2 }, opponent)
        if (isHit) {
          opponent.hit()
          shooter.isFinished = true
        }
      })
    })
  }

  _gameOver() {
    // this.isGameOver = true;
  }

  _renderStageUI() {
    ctx.fillStyle = 'grey'
    ctx.fillRect(FRAME_WIDTH * 0.1, this.level4Y, FRAME_WIDTH * 0.8, this.platformHeight)
  }
}

class Platform {
  constructor({ x, y, height = 30, width = 100 }) {
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
