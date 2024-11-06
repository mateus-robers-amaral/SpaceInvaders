class Particle {
    constructor(x, y, colorNumber, maxStrokeWeight) {
        this.position = createVector(x, y);
        this.velocity = p5.Vector.random2D();
        this.velocity.mult(random(0, 70));
        this.acceleration = createVector(0, 0);

        this.alpha = 1;
        this.colorNumber = colorNumber;
        this.maxStrokeWeight = maxStrokeWeight;
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    show() {
        let colorValue = color(`hsla(${this.colorNumber}, 100%, 50%, ${this.alpha})`);
        let mappedStrokeWeight = map(this.alpha, 0, 1, 0, this.maxStrokeWeight);

        strokeWeight(mappedStrokeWeight);
        stroke(colorValue);
        point(this.position.x, this.position.y);

        this.alpha -= 0.05;
    }

    update() {
        this.velocity.mult(0.5);

        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
    }

    isVisible() {
        return this.alpha > 0;
    }
}

class Bullet {
    constructor(xPosition, yPosition, size, goUp, colorValue, rotation) {
        this.goUp = goUp;
        this.speed = goUp ? -10 : 10;
        this.baseWidth = size;
        this.baseHeight = size * 2;

        this.color = colorValue !== undefined ? color(`hsl(${colorValue}, 100%, 50%)`) : 255;
        this.rotation = rotation;

        this.position = createVector(xPosition, yPosition);
        if (this.rotation === undefined)
            this.velocity = createVector(0, 45);
        else {
            let rotation = 45 - this.rotation;
            this.velocity = createVector(-45 + rotation, 45);
        }
        this.velocity.setMag(this.speed);
    }

    show() {
        noStroke();
        fill(this.color);

        let x = this.position.x;
        let y = this.position.y;

        push();
        translate(x, y);
        rotate(this.rotation);
        rect(0, -this.baseHeight, this.baseWidth, this.baseHeight);
        if (this.goUp) {
            triangle(-this.baseWidth / 2, -this.baseHeight,
                0, -this.baseHeight * 2,
                this.baseWidth / 2, -this.baseHeight
            );
        }
        pop();
    }

    update() {
        this.position.add(this.velocity);
    }
}

class Explosion {
    constructor(spawnX, spawnY, maxStrokeWeight) {
        this.position = createVector(spawnX, spawnY);
        this.gravity = createVector(0, 0.2);
        this.maxStrokeWeight = maxStrokeWeight;

        let randomColor = int(random(0, 359));
        this.color = randomColor;

        this.particles = [];
        this.explode();
    }

    explode() {
        for (let i = 0; i < 200; i++) {
            let particle = new Particle(this.position.x, this.position.y, this.color, this.maxStrokeWeight);
            this.particles.push(particle);
        }
    }

    show() {
        this.particles.forEach(particle => {
            particle.show();
        });
    }

    update() {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].applyForce(this.gravity);
            this.particles[i].update();

            if (!this.particles[i].isVisible()) {
                this.particles.splice(i, 1);
                i -= 1;
            }
        }
    }

    explosionComplete() {
        return this.particles.length === 0;
    }
}

class Pickup {
    constructor(xPosition, yPosition, colorValue) {
        this.position = createVector(xPosition, yPosition);
        this.velocity = createVector(0, height);

        this.speed = 2;
        this.velocity.setMag(this.speed);
        this.shapePoints = [0, 0, 0, 0];
        this.baseWidth = 15;

        this.colorValue = colorValue;
        this.color = color(`hsl(${colorValue}, 100%, 50%)`);
        this.angle = 0;
    }

    show() {
        noStroke();
        fill(this.color);

        let x = this.position.x;
        let y = this.position.y;

        push();
        translate(x, y);
        rotate(this.angle);
        rect(0, 0, this.baseWidth, this.baseWidth);
        pop();

        this.angle = frameRate() > 0 ? this.angle + 2 * (60 / frameRate()) : this.angle + 2;
        this.angle = this.angle > 360 ? 0 : this.angle;
    }

    update() {
        this.position.add(this.velocity);
    }

    isOutOfScreen() {
        return this.position.y > (height + this.baseWidth);
    }

    pointIsInside(point) {
        let x = point[0],
            y = point[1];

        let inside = false;
        for (let i = 0, j = this.shapePoints.length - 1; i < this.shapePoints.length; j = i++) {
            let xi = this.shapePoints[i][0],
                yi = this.shapePoints[i][1];
            let xj = this.shapePoints[j][0],
                yj = this.shapePoints[j][1];

            let intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }
}

class SpaceShip {
    constructor() {
        this.baseWidth = 70;
        this.baseHeight = this.baseWidth / 5;
        this.shooterWidth = this.baseWidth / 10;
        this.shapePoints = [];

        this.bullets = [];
        this.minFrameWaitCount = 7;
        this.waitFrameCount = this.minFrameWaitCount

        this.position = createVector(width / 2, height - this.baseHeight - 10);
        this.velocity = createVector(0, 0);

        this.speed = 15;
        this.health = 100;

        this.fullHealthColor = color('hsl(120, 100%, 50%)');
        this.halfHealthColor = color('hsl(60, 100%, 50%)');
        this.zeroHealthColor = color('hsl(0, 100%, 50%)');
        this.spaceShipColor = color('hsl(175, 100%, 50%)');

        this.GodMode = false;
        this.bulletColor = 0;
    }

    show() {
        noStroke();
        let bodyColor = lerpColor(this.zeroHealthColor, this.spaceShipColor, this.health / 100);
        fill(bodyColor);

        let x = this.position.x;
        let y = this.position.y;
        this.shapePoints = [
            [x - this.shooterWidth / 2, y - this.baseHeight * 2],
            [x + this.shooterWidth / 2, y - this.baseHeight * 2],
            [x + this.shooterWidth / 2, y - this.baseHeight * 1.5],
            [x + this.baseWidth / 4, y - this.baseHeight * 1.5],
            [x + this.baseWidth / 4, y - this.baseHeight / 2],
            [x + this.baseWidth / 2, y - this.baseHeight / 2],
            [x + this.baseWidth / 2, y + this.baseHeight / 2],
            [x - this.baseWidth / 2, y + this.baseHeight / 2],
            [x - this.baseWidth / 2, y - this.baseHeight / 2],
            [x - this.baseWidth / 4, y - this.baseHeight / 2],
            [x - this.baseWidth / 4, y - this.baseHeight * 1.5],
            [x - this.shooterWidth / 2, y - this.baseHeight * 1.5]
        ];

        beginShape();
        for (let i = 0; i < this.shapePoints.length; i++)
            vertex(this.shapePoints[i][0], this.shapePoints[i][1]);
        endShape(CLOSE);
    }

    update() {
        if (!keyIsDown(32))
            this.waitFrameCount = this.minFrameWaitCount;

        if (this.waitFrameCount < 0)
            this.waitFrameCount = this.minFrameWaitCount;

        this.bullets.forEach(bullet => {
            bullet.show();
            bullet.update();
        });
        for (let i = 0; i < this.bullets.length; i++) {
            if (this.bullets[i].position.y < -this.bullets[i].baseHeight ||
                this.bullets[i].position.x < -this.bullets[i].baseHeight ||
                this.bullets[i].position.x > width + this.bullets[i].baseHeight) {
                this.bullets.splice(i, 1);
                i -= 1;
            }
        }
    }

    moveShip(direction) {
        if (this.position.x < this.baseWidth / 2) {
            this.position.x = this.baseWidth / 2 + 1;
        }
        if (this.position.x > width - this.baseWidth / 2) {
            this.position.x = width - this.baseWidth / 2 - 1;
        }

        this.velocity = createVector(width, 0);
        if (direction === 'LEFT')
            this.velocity.setMag(-this.speed);
        else
            this.velocity.setMag(this.speed);

        this.position.add(this.velocity);
    }

    setBulletType(colorValue) {
        this.bulletColor = colorValue;
    }

    getBulletType() {
        switch (this.bulletColor) {
            case 0:
                return [
                    new Bullet(
                        this.position.x,
                        this.position.y - this.baseHeight * 1.5,
                        this.baseWidth / 10,
                        true,
                        this.bulletColor
                    )
                ];
                break;
            case 120:
                return [
                    new Bullet(
                        this.position.x - this.shooterWidth,
                        this.position.y - this.baseHeight * 1.5,
                        this.baseWidth / 10,
                        true,
                        this.bulletColor
                    ),
                    new Bullet(
                        this.position.x + this.shooterWidth,
                        this.position.y - this.baseHeight * 1.5,
                        this.baseWidth / 10,
                        true,
                        this.bulletColor
                    ),
                ]
                break;
            default:
                let array = [];
                for (let i = 0; i < 80; i += 10) {
                    array.push(
                        new Bullet(
                            this.position.x,
                            this.position.y - this.baseHeight * 1.5,
                            this.baseWidth / 10,
                            true,
                            this.bulletColor, -40 + i
                        )
                    );
                }
                return array;
                break;
        }
    }

    shootBullets() {
        if (this.waitFrameCount === this.minFrameWaitCount) {
            this.bullets.push(...this.getBulletType());
            playerShootSound.play();
        }
        this.waitFrameCount -= (1 * (60 / frameRate()));
    }

    decreaseHealth(amount) {
        if (!this.GodMode)
            this.health -= amount;
    }

    activateGodMode() {
        this.GodMode = true;
    }

    isDestroyed() {
        if (this.health <= 0) {
            this.health = 0;
            return true;
        } else {
            return false;
        }
    }

    reset() {
        this.bullets = [];
        this.waitFrameCount = this.minFrameWaitCount;
        this.health = 100;
        this.GodMode = false;
        this.bulletColor = 0;
    }

    pointIsInside(point) {
        let x = point[0],
            y = point[1];

        let inside = false;
        for (let i = 0, j = this.shapePoints.length - 1; i < this.shapePoints.length; j = i++) {
            let xi = this.shapePoints[i][0],
                yi = this.shapePoints[i][1];
            let xj = this.shapePoints[j][0],
                yj = this.shapePoints[j][1];

            let intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }
}

class Enemy {
    constructor(xPosition, yPosition, enemyBaseWidth) {
        this.position = createVector(xPosition, yPosition);
        this.prevX = this.position.x;

        this.positionToReach = createVector(random(0, width), random(0, height / 2));
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);

        this.maxSpeed = 5;
        this.maxForce = 5;

        this.color = 255;
        this.baseWidth = enemyBaseWidth;
        this.generalDimension = this.baseWidth / 5;
        this.shooterHeight = this.baseWidth * 3 / 20;
        this.shapePoints = [];

        this.magnitudeLimit = 50;
        this.bullets = [];
        this.constBulletTime = 7;
        this.currentBulletTime = this.constBulletTime;

        this.maxHealth = 100 * enemyBaseWidth / 45;
        this.health = this.maxHealth;
        this.fullHealthColor = color('hsl(120, 100%, 50%)');
        this.halfHealthColor = color('hsl(60, 100%, 50%)');
        this.zeroHealthColor = color('hsl(0, 100%, 50%)');
    }

    show() {
        noStroke();
        let currentColor = null;
        let mappedHealth = map(this.health, 0, this.maxHealth, 0, 100);
        if (mappedHealth < 50) {
            currentColor = lerpColor(this.zeroHealthColor, this.halfHealthColor, mappedHealth / 50);
        } else {
            currentColor = lerpColor(this.halfHealthColor, this.fullHealthColor, (mappedHealth - 50) / 50);
        }
        fill(currentColor);

        let x = this.position.x;
        let y = this.position.y;
        this.shapePoints = [
            [x - this.baseWidth / 2, y - this.generalDimension * 1.5],
            [x - this.baseWidth / 2 + this.generalDimension, y - this.generalDimension * 1.5],
            [x - this.baseWidth / 2 + this.generalDimension, y - this.generalDimension / 2],
            [x + this.baseWidth / 2 - this.generalDimension, y - this.generalDimension / 2],
            [x + this.baseWidth / 2 - this.generalDimension, y - this.generalDimension * 1.5],
            [x + this.baseWidth / 2, y - this.generalDimension * 1.5],
            [x + this.baseWidth / 2, y + this.generalDimension / 2],
            [x + this.baseWidth / 2 - this.baseWidth / 5, y + this.generalDimension / 2],
            [x + this.baseWidth / 2 - this.baseWidth / 5, y + this.generalDimension * 1.5],
            [x + this.baseWidth / 2 - this.baseWidth / 5 - this.baseWidth / 5, y + this.generalDimension * 1.5],
            [x + this.baseWidth / 2 - this.baseWidth / 5 - this.baseWidth / 5, y + this.generalDimension * 1.5 + this.shooterHeight],
            [x - this.baseWidth / 2 + this.baseWidth / 5 + this.baseWidth / 5, y + this.generalDimension * 1.5 + this.shooterHeight],
            [x - this.baseWidth / 2 + this.baseWidth / 5 + this.baseWidth / 5, y + this.generalDimension * 1.5],
            [x - this.baseWidth / 2 + this.baseWidth / 5, y + this.generalDimension * 1.5],
            [x - this.baseWidth / 2 + this.baseWidth / 5, y + this.generalDimension / 2],
            [x - this.baseWidth / 2, y + this.generalDimension / 2]
        ];

        beginShape();
        for (let i = 0; i < this.shapePoints.length; i++)
            vertex(this.shapePoints[i][0], this.shapePoints[i][1]);
        endShape(CLOSE);
    }

    checkArrival() {
        let desired = p5.Vector.sub(this.positionToReach, this.position);
        let desiredMag = desired.mag();
        if (desiredMag < this.magnitudeLimit) {
            let mappedSpeed = map(desiredMag, 0, 50, 0, this.maxSpeed);
            desired.setMag(mappedSpeed);
        } else {
            desired.setMag(this.maxSpeed);
        }

        let steering = p5.Vector.sub(desired, this.velocity);
        steering.limit(this.maxForce);
        this.acceleration.add(steering);
    }

    shootBullets() {
        if (this.currentBulletTime === this.constBulletTime) {
            let randomValue = random();
            if (randomValue < 0.5)
                this.bullets.push(
                    new Bullet(
                        this.prevX,
                        this.position.y + this.generalDimension * 5,
                        this.baseWidth / 5,
                        false
                    )
                );
            enemyShootSound.play();
        }
    }

    checkPlayerDistance(playerPosition) {
        if (this.currentBulletTime < 0)
            this.currentBulletTime = this.constBulletTime;

        let xPositionDistance = abs(playerPosition.x - this.position.x);
        if (xPositionDistance < 200) {
            this.shootBullets();
        } else {
            this.currentBulletTime = this.constBulletTime;
        }

        this.currentBulletTime -= (1 * (60 / frameRate()));
    }

    takeDamageAndCheckDeath() {
        this.health -= 20;
        if (this.health < 0)
            return true;
        else
            return false;
    }

    update() {
        this.prevX = this.position.x;

        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0);

        if (this.velocity.mag() <= 1)
            this.positionToReach = createVector(
                random(0, width),
                random(0, height / 2)
            );

        this.bullets.forEach(bullet => {
            bullet.show();
            bullet.update();
        });
        for (let i = 0; i < this.bullets.length; i++) {
            if (this.bullets[i].position.y > this.bullets[i].baseHeight + height) {
                this.bullets.splice(i, 1);
                i -= 1;
            }
        }
    }

    pointIsInside(point) {
        let x = point[0],
            y = point[1];

        let inside = false;
        for (let i = 0, j = this.shapePoints.length - 1; i < this.shapePoints.length; j = i++) {
            let xi = this.shapePoints[i][0],
                yi = this.shapePoints[i][1];
            let xj = this.shapePoints[j][0],
                yj = this.shapePoints[j][1];

            let intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }
}

class Boss extends Enemy {
    constructor(xPosition, yPosition) {
        super(xPosition, yPosition, 200);
        this.maxHealth = 500;
        this.health = this.maxHealth;
        this.spawnInterval = 100;
        this.spawnTimer = 0;
    }

    show() {
        noStroke();
        let currentColor = null;
        let mappedHealth = map(this.health, 0, this.maxHealth, 0, 100);
        if (mappedHealth < 50) {
            currentColor = lerpColor(this.zeroHealthColor, this.halfHealthColor, mappedHealth / 50);
        } else {
            currentColor = lerpColor(this.halfHealthColor, this.fullHealthColor, (mappedHealth - 50) / 50);
        }
        fill(currentColor);

        let x = this.position.x;
        let y = this.position.y;
        this.shapePoints = [
            [x - this.baseWidth / 2, y - this.baseWidth / 2],
            [x + this.baseWidth / 2, y - this.baseWidth / 2],
            [x + this.baseWidth / 2, y + this.baseWidth / 2],
            [x - this.baseWidth / 2, y + this.baseWidth / 2]
        ];

        beginShape();
        for (let i = 0; i < this.shapePoints.length; i++)
            vertex(this.shapePoints[i][0], this.shapePoints[i][1]);
        endShape(CLOSE);
    }

    update() {
        super.update();
        this.spawnTimer++;

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnSmallEnemies();
        }
    }

    spawnSmallEnemies() {
        for (let i = 0; i < 5; i++) {
            enemies.push(
                new Enemy(
                    this.position.x + random(-50, 50),
                    this.position.y + random(-50, 50),
                    20
                )
            );
        }
    }

    takeDamageAndCheckDeath() {
        this.health -= 10;
        if (this.health < 0)
            return true;
        else
            return false;
    }
}

const pickupColors = [0, 120, 175];

let spaceShip;
let spaceShipDestroyed = false;
let pickups = [];
let enemies = [];
let explosions = [];

let currentLevelCount = 1;
const maxLevelCount = 20;
let timeoutCalled = false;

let gameStarted = false;
let score = 0;
let gamePaused = false;

let explosionSound;
let backgroundSound;
let powerUpSound;
let playerShootSound;
let enemyShootSound;

function preload() {
    backgroundSound = new Howl({
        src: ['https://www.amigaremix.com/listen/3604/luke_mccrea_-_lff_skid_row_cracktro_-_amigaremix_03604.mp3'],
        autoplay: false,
        loop: true,
        preload: true,
        volume: 0.05
    });

    explosionSound = new Howl({
        src: ['data:audio/mp3;base64,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'],
        autoplay: false,
        loop: false,
        preload: true
    });

    powerUpSound = new Howl({
        src: ['data:audio/mp3;base64,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'],
        autoplay: false,
        loop: false,
        preload: true
    });

    playerShootSound = new Howl({
        src: ['data:audio/mp3;base64,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LABUAMoAAABy/77/3f/w/wAADwAiAEAAiAAAADf/rP/U/+r/+v8IABkAMQBfANcAC/+P/8j/4//0/wIAEgAmAEcApAAAAFn/uf/a/+7//f8LABwANgBsAOsALf+j/9D/5//4/wUAFAApAE4AugAAAHz/w//f//H/AAANAB8AOgB6AAAARP+w/9b/6//6/wcAFwAsAFQAwQAe/5P/y//k//T/AQAPACEAPgCKAAAAVv+7/9v/7v/8/wkAGAAuAFsAygAx/6L/0f/n//f/AwARACMAQQCcAAAAdP/D/9//8f/+/woAGgAwAGEA0wBH/67/1v/q//n/BAASACQARACkAAAAiP/J/+P/8/8AAAsAGwAyAGcAywBW/7f/2v/s//r/BQATACUARgCkAAAAl//O/+X/9P8AAAwAGwAyAGsAAABi/73/3f/u//v/BgATACUARwCiAEH/of/S/+j/9v8AAAwAGwAyAG0AAABs/8P/4P/w//z/BgATACUARwCgAEn/qf/V/+n/9/8BAAwAGwAxAG0AAAB0/8f/4v/x//3/BgATACQARQCbAFD/rv/Y/+v/9/8BAAwAGgAwAGsAAAB6/8r/4//y//3/BgASACIAQwCVAFj/sv/a/+z/+P8BAAsAGQAuAGYAAACA/8z/5P/y//3/BgARACEAPwCNAGD/tf/b/+z/+P8BAAsAFwArAF8AAACF/87/5f/z//3/BQAQAB4AOwCEAGf/t//c/+3/+P8AAAoAFQAoAFYAAACJ/8//5v/z//3/BQAOABwANQB6AG//t//d/+3/+P8AAAkAEwAkAEwAAACN/8//5v/z//z/BAANABkAMABwAAAAtf/d/+3/+P8AAAcAEQAhAEMAhQCP/8//5v/z//z/AwALABcAKgBmAAAAsv/d/+3/9////wYADwAdADkAfACP/83/5v/z//v/AgAKABQAJQBWAAAArf/c/+3/9////wUADQAZADEAawCN/8v/5v/y//v/AQAIABEAHwBFAAAApv/b/+3/9v/+/wMACwAVACkAXQCS/8j/5f/y//r/AAAGAA4AGwA3AGoAp//a/+z/9v/9/wIACQASACEAUQAAAML/5P/x//n///8FAAwAFgAsAF8Apf/X/+v/9f/8/wEABwAPABsAPQAAALj/4//w//j//v8DAAkAEgAiAE4Apv/T/+r/9f/7/wAABQAMABYALQBXALj/4f/w//j//f8CAAcADgAbAEEAAADN/+n/9P/6/wAAAwAJABEAIgBKALX/3v/v//f//f8AAAUACwAVAC0AAADF/+j/8//6////AgAHAA0AGQA7AAAA2f/u//b//P8AAAMACAAQACAAQwDE/+X/8v/5//7/AQAFAAoAEwAqAAAA0f/t//b/+////wIABgAMABYAMwDF/+L/8v/4//3/AAADAAcADQAbADgA0P/r//X/+//+/wEABAAIABAAJAAAANz/8f/4//z/AAABAAUACQASACkA0P/p//X/+v/+/wAAAgAGAAsAFgAsANv/8P/4//z///8AAAMABgAMABwAAADk//T/+v/9/wAAAQAEAAcADgAfANz/7v/4//z//v8AAAIABAAIABAAIADk//T/+v/9////AAACAAQACAATAAAA6//4//z//v8AAAAAAgAEAAkAFAAAAPP/+v/9////AAABAAIABAAJABQA7v/4//z//v8AAAAAAQACAAQACgAAAPP/+//+////AAAAAAEAAgAEAAoAAAD5//3///8AAAAAAAABAAIAAwAIAPj//f///wAAAAAAAAAAAAABAAIABQD9////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='],
        autoplay: false,
        loop: false,
        preload: true
    });

    enemyShootSound = new Howl({
        src: ['data:audio/mp3;base64,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7f9C/47/w//k//b//v8AAAAAAwANACIARwB+AM4AH/9z/6//1//v//v/AAAAAAAABQAQACcASwCBAMwAIf9x/6r/0v/r//n///8AAAAAAgAKABoANwBjAKIA+v9U/5b/xf/k//b//v8AAAAAAQAJABkANgBlAKgACgBp/6j/0v/s//r///8AAAAABAAQACcATQCGANUASv+Q/8L/4v/0//3/AAAAAAEABgATACsAUACGAM8ASf+M/7z/3f/x//z/AAAAAAAAAwAMAB0AOgBmAKUADgBz/6v/0v/r//n///8AAAAAAgAKABsAOQBnAKkAOv+E/7n/3f/y//z/AAAAAAAABQASACkATwCGAPb/aP+l/87/6f/4//7/AAAAAAEABwAUACwAUACEAPP/Zv+g/8n/5P/1//3/AAAAAAAABAANAB4AOgBkAJ8AR/+J/7n/2//v//v///8AAAAAAwALABwAOABkAKIAV/+Y/8X/4//1//3/AAAAAAEABgASACgATACAAP//f/+z/9b/7f/5////AAAAAAEABwAUACoATAB8APv/e/+u/9H/6f/3//7/AAAAAAAABAAMABwANgBdAJMAX/+Z/8P/4P/y//z/AAAAAAAAAgAKABoANABcAJQAbf+l/83/5//3//7/AAAAAAEABQAQACUARQBzAAEAj/+8/9z/8P/6////AAAAAAEABwASACYARABuAPz/i/+3/9f/7P/4//7/AAAAAAAAAwALABkAMABSAIEAcf+l/8r/5P/0//z/AAAAAAAAAgAJABYALQBPAIAAff+v/9L/6v/3//7/AAAAAAAABAAOAB8AOwBjAP//mv/D/9//8f/7////AAAAAAEABQAPAB8AOQBdAPn/l/++/9v/7f/4//7/AAAAAAAAAgAIABQAJwBEAGwAgP+t/8//5v/0//z/AAAAAAAAAQAHABEAJABBAGkAif+2/9b/6//4//7/AAAAAAAAAwAKABgALwBPAPj/o//I/+H/8v/7////AAAAAAAABAALABgALQBKAHIAof/E/93/7v/4//7/AAAAAAAAAQAGAA8AHgA1AFQABQC0/9L/5//1//z/AAAAAAAAAQAEAAwAGwAxAFEABwC7/9j/7P/3//7/AAAAAAAAAgAHABEAIgA7AF8Aq//M/+P/8v/6////AAAAAAAAAgAHABEAIAA3AFUAqf/I/9//7v/4//7/AAAAAAAAAQAEAAoAFQAmAD4A+/+6/9X/6P/0//z///8AAAAAAAACAAgAEgAiADkA/P/B/9r/7P/3//3/AAAAAAAAAQAEAAsAFwApAEIAs//P/+T/8v/6//7/AAAAAAAAAQAEAAoAFQAlADsABADN/+H/7//4//3/AAAAAAAAAAACAAYADQAYACkAQADC/9n/6f/0//v///8AAAAAAAABAAQACgAVACUAOwDH/93/7P/3//3///8AAAAAAAACAAYADQAZACoA///U/+b/8v/6//7/AAAAAAAAAAACAAUADAAWACQA+//U/+T/8P/4//3///8AAAAAAAAAAAIABwANABgAJgABAN7/6//1//v//v8AAAAAAAAAAAEABQALABQAIQABAOL/7v/3//z///8AAAAAAAAAAAIABgAMABYAIwDc/+r/9P/6//7/AAAAAAAAAAAAAAIABQAKABIAHQDe/+r/8//5//3///8AAAAAAAAAAAEAAgAGAAsAEgAcAOf/8P/3//z//v8AAAAAAAAAAAAAAQAEAAgADgAWAOv/8//5//3///8AAAAAAAAAAAAAAgAEAAgADQAAAPL/+P/8//7/AAAAAAAAAAAAAAAAAQADAAYACQAOAPT/+f/8//7/AAAAAAAAAAAAAAAAAAABAAIABAAHAAAA+v/8//7///8AAAAAAAAAAAAAAAAAAAEAAgADAAAA/f///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='],
        autoplay: false,
        loop: false,
        preload: true
    });

    backgroundSound.on('load', () => {
        explosionSound.on('load', () => {
            powerUpSound.on('load', () => {
                playerShootSound.on('load', () => {
                    enemyShootSound.on('load', () => {
                        document.getElementById('startScreen').style.display = 'flex';
                    });
                });
            });
        });
    });
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-holder');

    spaceShip = new SpaceShip();

    textAlign(CENTER);
    rectMode(CENTER);
    angleMode(DEGREES);

    document.getElementById('resumeButton').addEventListener('click', togglePause);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            if (!gameStarted) {
                enterFullScreen();
                startGame();
            } else {
                togglePause();
            }
        }
    });

    textFont('Press Start 2P');
}

function draw() {
    if (gamePaused) return;

    background(0);

    for (let i = 0; i < 50; i++) {
        let x = random(width);
        let y = random(height);
        let size = random(1, 3);
        let colorValue = color(`hsla(${int(random(359))}, 100%, 50%, ${random(0.3, 0.7)})`);
        fill(colorValue);
        noStroke();
        ellipse(x, y, size, size);
    }

    if (keyIsDown(71) && keyIsDown(79) && keyIsDown(68))
        spaceShip.activateGodMode();

    if (spaceShip.isDestroyed()) {
        if (!spaceShipDestroyed) {
            explosions.push(
                new Explosion(
                    spaceShip.position.x,
                    spaceShip.position.y,
                    spaceShip.baseWidth
                )
            );
            explosionSound.play();
            spaceShipDestroyed = true;
        }

        for (let i = 0; i < enemies.length; i++) {
            explosions.push(
                new Explosion(
                    enemies[i].position.x,
                    enemies[i].position.y,
                    (enemies[i].baseWidth * 7) / 45
                )
            );
            explosionSound.play();
            enemies.splice(i, 1);
            i -= 1;
        }

        textSize(32);
        noStroke();
        fill(255, 0, 0);
        text('You Are DEAD !!!', width / 2, height / 2);

    } else {
        spaceShip.show();
        spaceShip.update();

        if (keyIsDown(LEFT_ARROW) && keyIsDown(RIGHT_ARROW)) { /* Do nothing */ } else {
            if (keyIsDown(LEFT_ARROW)) {
                spaceShip.moveShip('LEFT');
            } else if (keyIsDown(RIGHT_ARROW)) {
                spaceShip.moveShip('RIGHT');
            }
        }

        if (keyIsDown(32)) {
            spaceShip.shootBullets();
        }
    }

    enemies.forEach(element => {
        element.show();
        element.checkArrival();
        element.update();
        element.checkPlayerDistance(spaceShip.position);
    });

    for (let i = 0; i < explosions.length; i++) {
        explosions[i].show();
        explosions[i].update();

        if (explosions[i].explosionComplete()) {
            explosions.splice(i, 1);
            i -= 1;
        }
    }

    for (let i = 0; i < pickups.length; i++) {
        pickups[i].show();
        pickups[i].update();

        if (pickups[i].isOutOfScreen()) {
            pickups.splice(i, 1);
            i -= 1;
        }
    }

    for (let i = 0; i < spaceShip.bullets.length; i++) {
        for (let j = 0; j < enemies.length; j++) {
            if (spaceShip.bullets[i])
                if (enemies[j].pointIsInside([spaceShip.bullets[i].position.x, spaceShip.bullets[i].position.y])) {
                    let enemyDead = enemies[j].takeDamageAndCheckDeath();
                    if (enemyDead) {
                        explosions.push(
                            new Explosion(
                                enemies[j].position.x,
                                enemies[j].position.y,
                                (enemies[j].baseWidth * 7) / 45
                            )
                        );
                        explosionSound.play();
                        if (enemies[j].baseWidth > 100) {
                            enemies.push(
                                new Enemy(
                                    enemies[j].position.x,
                                    enemies[j].position.y,
                                    enemies[j].baseWidth / 2
                                )
                            );
                            enemies.push(
                                new Enemy(
                                    enemies[j].position.x,
                                    enemies[j].position.y,
                                    enemies[j].baseWidth / 2
                                )
                            );

                        }

                        let randomValue = random();
                        if (randomValue < 0.5) {
                            pickups.push(
                                new Pickup(
                                    enemies[j].position.x,
                                    enemies[j].position.y,
                                    pickupColors[floor(random() * pickupColors.length)]
                                )
                            );

                        }

                        enemies.splice(j, 1);
                        j -= 1;

                        score += 10;
                    }
                    spaceShip.bullets.splice(i, 1);
                    i = i === 0 ? 0 : i - 1;
                }
        }
    }

    for (let i = 0; i < pickups.length; i++) {
        if (spaceShip.pointIsInside([pickups[i].position.x, pickups[i].position.y])) {
            let colorValue = pickups[i].colorValue;
            spaceShip.setBulletType(colorValue);
            powerUpSound.play();

            pickups.splice(i, 1);
            i -= 1;
        }
    }

       for (let i = 0; i < enemies.length; i++) {
        for (let j = 0; j < enemies[i].bullets.length; j++) {
            if (enemies[i].bullets[j])
                if (spaceShip.pointIsInside([enemies[i].bullets[j].position.x, enemies[i].bullets[j].position.y])) {
                    spaceShip.decreaseHealth(2 * enemies[i].bullets[j].baseWidth / 10);
                    enemies[i].bullets.splice(j, 1);

                    j -= 1;
                }
        }
    }
    if (spaceShip.GodMode) {
        textSize(32);
        noStroke();
        fill(255);
        text('God Mode', width - 80, height - 30);
    }

    if (enemies.length === 0 && !spaceShipDestroyed && gameStarted) {
        textSize(32);
        noStroke();
        fill(255);
        if (currentLevelCount <= maxLevelCount) {
            text(`Loading Level ${currentLevelCount}`, width / 2, height / 2);
            if (!timeoutCalled) {
                window.setTimeout(incrementLevel, 3000);
                timeoutCalled = true;
            }
        } else {
            textSize(32);
            noStroke();
            fill(0, 255, 0);
            text('You WON !!!', width / 2, height / 2);
            let randomValue = random();
            if (randomValue < 0.1) {
                explosions.push(
                    new Explosion(
                        random(0, width),
                        random(0, height),
                        random(0, 10)
                    )
                );
                explosionSound.play();
            }
        }
    }
    if (!gameStarted) {
        textStyle(BOLD);
        textSize(128);
        noStroke();
        fill(color(`hsl(${int(random(359))}, 100%, 50%)`));
        text('SPACE INVADERS', width / 2 + 10, height / 4);
    }

    textSize(24);
    noStroke();
    fill(255);
    text('SCORE', width / 4, 60);
    text(score, width / 4, 90);
    text('HEALTH', 3 * width / 4, 60);
    text(`${Math.round(spaceShip.health)}%`, 3 * width / 4, 90);

    drawCRTEffect();
}

function incrementLevel() {
    let i;
    switch (currentLevelCount) {
        case 1:
            enemies.push(
                new Enemy(
                    random(0, width), -30,
                    random(45, 70)
                )
            );
            break;
        case 2:
            for (i = 0; i < 2; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(45, 70)
                    )
                );
            }
            break;
        case 3:
            for (i = 0; i < 15; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(45, 70)
                    )
                );
            }
            break;
        case 4:
            enemies.push(
                new Enemy(
                    random(0, width), -30,
                    random(150, 170)
                )
            );
            break;
        case 5:
            for (i = 0; i < 2; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(150, 170)
                    )
                );
            }
            break;
        case 6:
            for (i = 0; i < 20; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        20
                    )
                );
            }
            break;
        case 7:
            for (i = 0; i < 50; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        20
                    )
                );
            }
            break;
        case 8:
            for (i = 0; i < 20; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(20, 170)
                    )
                );
            }
            break;
        case 9:
            for (i = 0; i < 20; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(70, 120)
                    )
                );
            }
            break;
        case 10:
            enemies.push(
                new Boss(
                    width / 2, -100
                )
            );
            break;
        case 11:
            for (i = 0; i < 30; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(20, 170)
                    )
                );
            }
            break;
        case 12:
            for (i = 0; i < 40; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(20, 170)
                    )
                );
            }
            break;
        case 13:
            for (i = 0; i < 50; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(20, 170)
                    )
                );
            }
            break;
        case 14:
            for (i = 0; i < 60; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(20, 170)
                    )
                );
            }
            break;
        case 15:
            for (i = 0; i < 70; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(20, 170)
                    )
                );
            }
            break;
        case 16:
            for (i = 0; i < 80; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(20, 170)
                    )
                );
            }
            break;
        case 17:
            for (i = 0; i < 90; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(20, 170)
                    )
                );
            }
            break;
        case 18:
            for (i = 0; i < 100; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(20, 170)
                    )
                );
            }
            break;
        case 19:
            for (i = 0; i < 110; i++) {
                enemies.push(
                    new Enemy(
                        random(0, width), -30,
                        random(20, 170)
                    )
                );
            }
            break;
        case 20:
            enemies.push(
                new Boss(
                    width / 2, -100
                )
            );
            break;
    }

    if (currentLevelCount <= maxLevelCount) {
        timeoutCalled = false;
        currentLevelCount++;
    }
}

function resetGame() {
    spaceShipDestroyed = false;
    enemies = [];
    explosions = [];
    spaceShip.reset();

    currentLevelCount = 1;
    timeoutCalled = false;
    score = 0;

    gameStarted = true;
    gamePaused = false;
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'none';
}

function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        document.getElementById('pauseScreen').style.display = 'flex';
    } else {
        document.getElementById('pauseScreen').style.display = 'none';
    }
}

function startGame() {
    gameStarted = true;
    document.getElementById('startScreen').style.display = 'none';
    backgroundSound.play();
}

function enterFullScreen() {
    const canvas = document.querySelector('canvas');
    if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
    } else if (canvas.mozRequestFullScreen) {
        canvas.mozRequestFullScreen();
    } else if (canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen();
    } else if (canvas.msRequestFullscreen) {
        canvas.msRequestFullscreen();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function drawCRTEffect() {
    push();
    drawingContext.shadowOffsetX = 0.3;
    drawingContext.shadowOffsetY = 0.3;
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = 'rgba(255, 255, 255, 0.5)';
    drawingContext.filter = 'blur(1px)';
    pop();
}