const frame = document.getElementById('cleanser-canvas')
const gameFrame = document.getElementById('cleanser')
const menu = document.querySelector('#cleanser .menu')
const ctx = frame.getContext('2d')
const FRAME_WIDTH = 700
const FRAME_HEIGHT = Math.max(document.documentElement.clientHeight - 150, 500)
const GRAVITY = 0.5
const STAGE = {
  FLOPPY: 'floppy',
  CD: 'cd',
  PEN_DRIVE: 'penDrive'
}

frame.height = FRAME_HEIGHT
gameFrame.style.height = FRAME_HEIGHT + 'px'
frame.width = FRAME_WIDTH
gameFrame.style.width = FRAME_WIDTH + 'px'

const platformImg = new Image();
platformImg.src = 'https://www.html5canvastutorials.com/demos/assets/wood-pattern.png';
platformImg.width = 200
platformImg.height = 145

const playerImg = new Image();
playerImg.src = 'assets/player.png';

const opponentImg = new Image();
opponentImg.src = 'assets/opponent.png';


const Utils = {
  isCollision(obj1, obj2) {
    return obj1.x <= obj2.x + obj2.width &&
      obj1.x + obj1.width >= obj2.x &&
      obj1.y <= obj2.y + obj2.height &&
      obj1.y + obj1.height >= obj2.y
  },
  paintPlatform({ x, y, width, height}) {
    const repetition = parseInt(width / platformImg.width)
    const sliceWidth = width % platformImg.width

    for (let i = 0; i < repetition; i++) {
      ctx.drawImage(platformImg, x + (platformImg.width * i), y, platformImg.width, height);
    }
    ctx.drawImage(platformImg, 0, 0, sliceWidth, platformImg.height, x + width - sliceWidth, y, sliceWidth, height);
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

    ctx.fillStyle = '#d4f0ff'
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
  constructor({ height = 50, width = 40, x = 20, y = FRAME_HEIGHT - height } = {}) {
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
    this._renderShooters()
    ctx.save()
    ctx.translate(this.dirn === 1 ? this.x : this.x + this.width, this.y)
    ctx.scale(1 * this.dirn, 1)
    ctx.drawImage(playerImg, 0, 0, this.width, this.height);
    ctx.restore()
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

    ctx.save()
    ctx.translate(this.dirn === 1 ? this.x : this.x + this.width, this.y)
    ctx.scale(1 * this.dirn, 1)
    ctx.drawImage(opponentImg, 0, 0, this.width, this.height);
    ctx.restore()

    ctx.fillStyle = '#d4f0ff'
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
  constructor({ stage }) {
    this.stage = stage
  }
  
  render() {
    this['render' + this.stage]()
  }

  ['render' + STAGE.FLOPPY]() {
    // Floopy bg colour
    ctx.fillStyle = `#05080f`
    ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);

    // Center circle
    ctx.beginPath()
    ctx.fillStyle = '#999'
    ctx.arc(FRAME_WIDTH/2, FRAME_HEIGHT/2 - 2, 51, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.fillStyle = '#444a51'
    ctx.arc(FRAME_WIDTH/2, FRAME_HEIGHT/2, 50, 0, 2 * Math.PI)
    ctx.fill()

    // Rectangles on above circle
    ctx.fillStyle = '#999'
    ctx.fillRect((FRAME_WIDTH/2) - 11, (FRAME_HEIGHT/2) - 11, 20, 20)
    ctx.fillStyle = '#05080f'
    ctx.fillRect((FRAME_WIDTH/2) - 10, (FRAME_HEIGHT/2) - 10, 20, 20)

    ctx.fillStyle = '#999'
    ctx.fillRect((FRAME_WIDTH/2) + 19, (FRAME_HEIGHT/2) - 16, 20, 30)
    ctx.fillStyle = '#05080f'
    ctx.fillRect((FRAME_WIDTH/2) + 20, (FRAME_HEIGHT/2) - 15, 20, 30)


    // Cut at top
    ctx.fillStyle = '#fff'
    ctx.fillRect(80, 0, FRAME_WIDTH - 160, 10)

    // Top rectangles
    let width = 200
    ctx.fillStyle = '#272a2f'
    ctx.fillRect(FRAME_WIDTH/2 - width/2 - 49, 6, width + 100, 100)
    ctx.fillStyle = '#16191f'
    ctx.fillRect(FRAME_WIDTH/2 - width/2 - 50, 5, width + 100, 100)
    ctx.fillStyle = '#999'
    ctx.fillRect(FRAME_WIDTH/2 - width/2 - 49, 6, width, 100)
    ctx.fillStyle = '#444a51'
    ctx.fillRect(FRAME_WIDTH/2 - width/2 - 50, 5, width, 100)

    ctx.fillStyle = '#999'
    ctx.fillRect(FRAME_WIDTH/2 - width/2 - 21, 24, 50, 75)
    ctx.fillRect(FRAME_WIDTH/2 - width/2 - 5, 19, 20, 10)
    ctx.fillRect(FRAME_WIDTH/2 + 9, 19, 30, 20)

    // Black spaces on top silver surface
    ctx.fillStyle = '#16191f'
    ctx.fillRect(FRAME_WIDTH/2 - width/2 - 20, 25, 50, 75)
    ctx.fillRect(FRAME_WIDTH/2 - width/2 - 4, 20, 20, 10)
    ctx.fillRect(FRAME_WIDTH/2 + 10, 20, 30, 20)

    ctx.fillStyle = '#272a2f'
    ctx.fillRect(FRAME_WIDTH/2 + width/2 - 49, 20, 100, 10)
    ctx.fillStyle = '#000'
    ctx.fillRect(FRAME_WIDTH/2 + width/2 - 49, 21, 98, 8)

    // Bottom left rectangle
    ctx.fillStyle = '#fff'
    ctx.fillRect(20, FRAME_HEIGHT - 50, 40, 30)
  }

  ['render' + STAGE.CD]() {
    const radius = Math.min(FRAME_HEIGHT, FRAME_WIDTH)/2 - 15
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT)

    // CD surface
    ctx.beginPath()
    ctx.strokeStyle = '#fff'
    ctx.arc(FRAME_WIDTH/2 - 1, FRAME_HEIGHT/2 - 1, radius, 0, 2 * Math.PI)
    ctx.stroke()

    ctx.beginPath()
    ctx.fillStyle = '#797979'
    ctx.arc(FRAME_WIDTH/2, FRAME_HEIGHT/2, radius, 0, 2 * Math.PI)
    ctx.fill()

    // Inner dark silver ring
    ctx.beginPath()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 0.5
    ctx.arc(FRAME_WIDTH/2 - 1, FRAME_HEIGHT/2 - 1, radius * 0.4, 0, 2 * Math.PI)
    ctx.stroke()

    ctx.beginPath()
    ctx.fillStyle = '#444444'
    ctx.arc(FRAME_WIDTH/2, FRAME_HEIGHT/2, radius * 0.4, 0, 2 * Math.PI)
    ctx.fill()

    // Inner plastic ring
    ctx.beginPath()
    ctx.fillStyle = '#b6b5bd'
    ctx.arc(FRAME_WIDTH/2, FRAME_HEIGHT/2, radius * 0.35, 0, 2 * Math.PI)
    ctx.fill()

    // Lines on plastic ring
    ctx.beginPath()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 0.5
    ctx.arc(FRAME_WIDTH/2, FRAME_HEIGHT/2, radius * 0.32, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.arc(FRAME_WIDTH/2, FRAME_HEIGHT/2, radius * 0.27, 0, 2 * Math.PI)
    ctx.stroke()

    //Innermost dark silver ring
    ctx.beginPath()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 0.5
    ctx.arc(FRAME_WIDTH/2 - 1, FRAME_HEIGHT/2 - 1, radius * 0.16, 0, 2 * Math.PI)
    ctx.stroke()

    ctx.beginPath()
    ctx.fillStyle = '#444444'
    ctx.arc(FRAME_WIDTH/2, FRAME_HEIGHT/2, radius * 0.16, 0, 2 * Math.PI)
    ctx.fill()

    // Blank surface at center
    ctx.beginPath()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 0.5
    ctx.arc(FRAME_WIDTH/2 - 1, FRAME_HEIGHT/2 - 1, radius * 0.14, 0, 2 * Math.PI)
    ctx.stroke()

    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.arc(FRAME_WIDTH/2, FRAME_HEIGHT/2, radius * 0.14, 0, 2 * Math.PI)
    ctx.fill()
  }

  ['render' + STAGE.PEN_DRIVE]() {
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT)

    ctx.strokeStyle = '#444'
    ctx.fillStyle = '#555'
    ctx.fillRect(FRAME_WIDTH * 0.25 + 3, 177, FRAME_WIDTH * 0.5, FRAME_HEIGHT - 230)
    ctx.fillStyle = '#444'
    ctx.rect(FRAME_WIDTH * 0.25, 180, FRAME_WIDTH * 0.5, FRAME_HEIGHT - 230)
    ctx.moveTo(FRAME_WIDTH * 0.25, FRAME_HEIGHT - 50)
    ctx.bezierCurveTo(FRAME_WIDTH * 0.3, FRAME_HEIGHT - 10, FRAME_WIDTH * 0.7, FRAME_HEIGHT - 10, FRAME_WIDTH * 0.75, FRAME_HEIGHT - 50)
    ctx.fill()
    ctx.beginPath()
    ctx.strokeStyle = 'black'

    // Hole at bottom
    ctx.fillStyle = '#888'
    ctx.fillRect(FRAME_WIDTH * 0.5 - 14, FRAME_HEIGHT - 49, 30, 20)
    ctx.fillStyle = 'black'
    ctx.fillRect(FRAME_WIDTH * 0.5 - 15, FRAME_HEIGHT - 50, 30, 20)

    // Slim rectangles between top and base
    ctx.fillStyle = '#333'
    ctx.fillRect(FRAME_WIDTH * 0.35 + 2, 142, FRAME_WIDTH * 0.3, 20)
    ctx.fillStyle = '#222'
    ctx.fillRect(FRAME_WIDTH * 0.35, 140, FRAME_WIDTH * 0.3, 20)

    ctx.fillStyle = '#444'
    ctx.fillRect(FRAME_WIDTH * 0.3 + 2, 158, FRAME_WIDTH * 0.4, 20)
    ctx.fillStyle = '#333'
    ctx.fillRect(FRAME_WIDTH * 0.3, 160, FRAME_WIDTH * 0.4, 20)

    // Female USB
    ctx.fillStyle = '#aaa'
    ctx.fillRect(FRAME_WIDTH * 0.4 + 5, 25, FRAME_WIDTH * 0.2, 110)
    ctx.fillStyle = '#888'
    ctx.fillRect(FRAME_WIDTH * 0.4, 30, FRAME_WIDTH * 0.2, 110)

    // Rectangles on top
    ctx.fillStyle = '#bbb'
    ctx.fillRect(FRAME_WIDTH * 0.4 + 22, 72, 30, 20)
    ctx.fillRect(FRAME_WIDTH * 0.6 - 48, 72, 30, 20)

    ctx.fillStyle = 'black'
    ctx.fillRect(FRAME_WIDTH * 0.4 + 20, 70, 30, 20)
    ctx.fillRect(FRAME_WIDTH * 0.6 - 50, 70, 30, 20)

    // Line at top
    ctx.moveTo(FRAME_WIDTH * 0.5 - 5, 30)
    ctx.lineTo(FRAME_WIDTH * 0.5 - 5, 70)
    ctx.lineTo(FRAME_WIDTH * 0.5 + 10, 70)
    ctx.lineTo(FRAME_WIDTH * 0.5 + 10, 90)
    ctx.lineTo(FRAME_WIDTH * 0.5 - 5, 90)
    ctx.lineTo(FRAME_WIDTH * 0.5 - 5, 140)
    ctx.stroke()
  }
}

class Stage {
  constructor() {
    this.currentStage = 0

    this.pause = false
    this.isGameOver = false
    this.platformHeight = 30
    this.playerJumpDistance = 10

    this._resetPlayer()
    this.platformDistance = this.player.height + this.platformHeight + this.playerJumpDistance

    this.level1Y = FRAME_HEIGHT - this.platformDistance
    this.level2Y = this.level1Y - this.platformDistance
    this.level3Y = this.level2Y - this.platformDistance
    this.level4Y = this.level3Y - this.platformDistance
    this.level5Y = this.level4Y - this.platformDistance

    this.platformsConfig = [
      {
        name: STAGE.FLOPPY,
        config: [
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
        ],
        ui: [
          { 
            x: FRAME_WIDTH * 0.3,
            y: this.level4Y,
            width: FRAME_WIDTH * 0.4,
            height: this.platformHeight
          }
        ]
      },
      {
        name: STAGE.CD,
        config: [
          {
            x: 0,
            y: FRAME_HEIGHT,
            width: FRAME_WIDTH
          },
          {
            x: 0,
            y: this.level1Y,
            width: FRAME_WIDTH * 0.2
          },
          {
            x: FRAME_WIDTH * 0.35,
            y: this.level1Y,
            width: FRAME_WIDTH * 0.3
          },
          {
            x: FRAME_WIDTH * 0.8,
            y: this.level1Y,
            width: FRAME_WIDTH * 0.2
          },
          {
            x: 0,
            y: this.level2Y,
            width: FRAME_WIDTH * 0.1
          },
          {
            x: FRAME_WIDTH * 0.45,
            y: this.level2Y,
            width: FRAME_WIDTH * 0.1
          },
          {
            x: FRAME_WIDTH * 0.9,
            y: this.level2Y,
            width: FRAME_WIDTH * 0.1
          },
          {
            x: 0,
            y: this.level3Y,
            width: FRAME_WIDTH * 0.1
          },
          {
            x: FRAME_WIDTH * 0.2,
            y: this.level3Y,
            width: FRAME_WIDTH * 0.15,
            height: this.level2Y - this.level3Y + this.platformHeight
          },
          {
            x: FRAME_WIDTH * 0.45,
            y: this.level3Y,
            width: FRAME_WIDTH * 0.1
          },
          {
            x: FRAME_WIDTH * 0.65,
            y: this.level3Y,
            width: FRAME_WIDTH * 0.15,
            height: this.level2Y - this.level3Y + this.platformHeight
          },
          {
            x: FRAME_WIDTH * 0.9,
            y: this.level3Y,
            width: FRAME_WIDTH * 0.1
          },
          {
            x: 0,
            y: this.level4Y,
            width: FRAME_WIDTH * 0.15
          },
          {
            x: FRAME_WIDTH * 0.3,
            y: this.level4Y,
            width: FRAME_WIDTH * 0.4
          },
          {
            x: FRAME_WIDTH * 0.85,
            y: this.level4Y,
            width: FRAME_WIDTH * 0.15
          },
          {
            x: FRAME_WIDTH * 0.2,
            y: this.level5Y,
            width: FRAME_WIDTH * 0.6
          }
        ]
      },
      {
        name: STAGE.PEN_DRIVE,
        config: [
          {
            x: 0,
            y: FRAME_HEIGHT,
            width: FRAME_WIDTH
          },
          {
            x: FRAME_WIDTH * 0.1,
            y: this.level1Y,
            width: FRAME_WIDTH * 0.35
          },
          {
            x: FRAME_WIDTH * 0.55,
            y: this.level1Y,
            width: FRAME_WIDTH * 0.35
          },
          {
            x: 0,
            y: this.level2Y,
            width: FRAME_WIDTH * 0.2
          },
          {
            x: FRAME_WIDTH * 0.8,
            y: this.level2Y,
            width: FRAME_WIDTH * 0.2
          },
          {
            x: FRAME_WIDTH * 0.1,
            y: this.level3Y,
            width: FRAME_WIDTH * 0.25
          },
          {
            x: FRAME_WIDTH * 0.65,
            y: this.level3Y,
            width: FRAME_WIDTH * 0.2
          },
          {
            x: 0,
            y: this.level4Y,
            width: FRAME_WIDTH * 0.2
          },
          {
            x: FRAME_WIDTH * 0.8,
            y: this.level4Y,
            width: FRAME_WIDTH * 0.2
          },
          {
            x: FRAME_WIDTH * 0.1,
            y: this.level5Y,
            width: FRAME_WIDTH * 0.8
          },
          {
            x: FRAME_WIDTH * 0.35,
            y: this.level4Y,
            width: FRAME_WIDTH * 0.1,
            height: this.level1Y - this.level3Y + this.platformHeight
          },
          {
            x: FRAME_WIDTH * 0.55,
            y: this.level4Y,
            width: FRAME_WIDTH * 0.1,
            height: this.level1Y - this.level3Y + this.platformHeight
          },
          {
            x: FRAME_WIDTH * 0.45,
            y: this.level5Y + this.platformHeight,
            width: FRAME_WIDTH * 0.1,
            height: this.level1Y - this.level5Y
          }
        ]
      }
    ]

    this.opponentsConfig = [
      {
        x: 0
      },
      {
        x: FRAME_WIDTH * 0.3
      },
      {
        x: FRAME_WIDTH * 0.6
      },
      {
        x: FRAME_WIDTH * 1
      },
      {
        x: FRAME_WIDTH * 0.15,
        y: this.level4Y
      },
      {
        x: FRAME_WIDTH * 0.4,
        y: this.level4Y
      },
      {
        x: FRAME_WIDTH * 0.75,
        y: this.level4Y
      },
      {
        x: 0,
        y: this.level3Y
      },
      {
        x: FRAME_WIDTH,
        y: this.level3Y
      },
      {
        x: FRAME_WIDTH * 0.5,
        y: this.level2Y
      }
    ]
    
    this._resetPlatforms()
    this._resetOpponents()
    this._resetBackground()
  }

  render() {
    if (!this.pause) {
      // We may want to add some UI on existing platforms, thus render platform 1st and then UI
      this.background.render()
      this.platformInstances.forEach(platform => platform.render())
      this._renderStageUI()
      this.opponents.forEach(opponent => opponent.render())
      this.player.render()
    }
  }

  update() {
    if (!this.isGameOver && !this.pause) {
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

      if (!this.opponents.length) {
        return this._stageUp()
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

  _stageUp() {
    this.currentStage++
    this.pause = true
    setTimeout(() => {
      this._resetPlatforms()
      this._resetOpponents()
      this._resetPlayer()
      this.pause = false
    }, 5000)
  }

  _renderStageUI() {
    const uiConfigList = this.platformsConfig[this.currentStage].ui
    uiConfigList && uiConfigList.forEach(config => Utils.paintPlatform({ x: FRAME_WIDTH * 0.3, y: this.level4Y, width: FRAME_WIDTH * 0.4, height: this.platformHeight }, true))

  }

  _resetPlatforms() {
    this.platformInstances = this.platformsConfig[this.currentStage].config.map(config => new Platform(config))
  }

  _resetOpponents() {
    this.opponents = this.opponentsConfig.map(config => new Opponent(config))
  }

  _resetPlayer() {
    this.player = new Player()
  }

  _resetBackground() {
    this.background = new Background({ stage: this.platformsConfig[this.currentStage].name })
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
    Utils.paintPlatform(this)
  }
}

class Cleanser {
  constructor() {
    this.stage = new Stage()
  }
  update() {
    this.stage.update()
  }
  render() {
    this.stage.render()
  }
  loop() {
    this.update()
    this.render()
    requestAnimationFrame(() => this.loop())
  }
  start() {
    menu.className += 'hidden'
    this.loop()
  }
}

window.cleanser = new Cleanser()
