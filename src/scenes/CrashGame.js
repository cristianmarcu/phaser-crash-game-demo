import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants.js";
import { LAYOUT } from "../config/layout.js";
import SoundFX from "../audio/SoundFX.js";
import { fitTextToBox } from "../utils/text.js";

export default class CrashGame extends Phaser.Scene {
  constructor() {
    super("CrashGame");

    this.balance = 1000;
    this.bet = 50;
    this.minBet = 10;
    this.maxBet = 500;
    this.betStep = 10;
    this.lastWin = 0;

    this.multiplier = 1;
    this.crashPoint = 1;
    this.roundActive = false;
    this.hasBet = false;
    this.hasCashedOut = false;
    this.inputLocked = false;

    this.elapsed = 0;
    this.roundSpeed = 0.00055;

    this.graphPoints = [];
    this.sfx = new SoundFX();
  }

  create() {
    this.createBackground();
    this.createHeader();
    this.createGraphPanel();
    this.createRocket();
    this.createStatusBox();
    this.createBottomPanels();
    this.createActionButton();
    this.createSoundButton();
    this.createKeyboardControls();
    this.createAmbientAnimations();

    this.updateDisplay();
    this.setStatus("Place your bet and launch the rocket");
  }

  update(time, delta) {
    if (!this.roundActive) return;

    this.elapsed += delta;
    this.multiplier = this.calculateMultiplier(this.elapsed);

    this.updateGraph();
    this.updateRocketPosition();
    this.updateDisplay();

    const currentTick = Math.floor(this.elapsed / 160);
    const previousTick = Math.floor((this.elapsed - delta) / 160);

    if (currentTick !== previousTick) {
      this.sfx.tick();
    }

    if (this.multiplier >= this.crashPoint) {
      this.crashRound();
    }
  }

  formatMoney(value) {
    return Number(value).toFixed(2);
  }

  formatMultiplier(value) {
    return `${Number(value).toFixed(2)}x`;
  }

  createPanel(x, y, width, height, fill = 0x100006, alpha = 0.94) {
    return this.add
      .rectangle(x, y, width, height, fill, alpha)
      .setStrokeStyle(3, 0xffd700);
  }

  createBackground() {
    this.add.rectangle(480, 270, GAME_WIDTH, GAME_HEIGHT, 0x05020a);

    this.add.circle(145, 105, 220, 0x3b003f, 0.42);
    this.add.circle(830, 95, 210, 0x002b5f, 0.38);
    this.add.circle(760, 455, 180, 0x4a2100, 0.3);

    for (let i = 0; i < 130; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 3),
        0xffe8a3,
        Phaser.Math.FloatBetween(0.12, 0.7),
      );

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.15, 1),
        duration: Phaser.Math.Between(700, 2200),
        yoyo: true,
        repeat: -1,
      });
    }

    this.add
      .rectangle(480, 505, 900, 58, 0x080304, 0.72)
      .setStrokeStyle(2, 0x6b3d00);
  }

  createHeader() {
    this.add
      .text(480, LAYOUT.titleY, "CRASH ROCKET", {
        fontSize: "44px",
        fontStyle: "bold",
        color: "#ffd700",
        stroke: "#7a001e",
        strokeThickness: 8,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#ffb000",
          blur: 12,
          fill: true,
        },
      })
      .setOrigin(0.5);

    this.add
      .text(480, LAYOUT.subtitleY, "CASH OUT BEFORE THE CRASH", {
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ffe9a6",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
  }

  createGraphPanel() {
    this.graphPanel = this.createPanel(
      LAYOUT.graphX,
      LAYOUT.graphY,
      LAYOUT.graphW,
      LAYOUT.graphH,
      0x080013,
      0.92,
    );

    this.graphLeft = LAYOUT.graphX - LAYOUT.graphW / 2 + 45;
    this.graphRight = LAYOUT.graphX + LAYOUT.graphW / 2 - 35;
    this.graphTop = LAYOUT.graphY - LAYOUT.graphH / 2 + 40;
    this.graphBottom = LAYOUT.graphY + LAYOUT.graphH / 2 - 35;

    this.gridGraphics = this.add.graphics();
    this.lineGraphics = this.add.graphics();

    this.drawGrid();

    this.multiplierText = this.add
      .text(LAYOUT.multiplierX, LAYOUT.multiplierY, "1.00x", {
        fontSize: "58px",
        fontStyle: "bold",
        color: "#00ff99",
        stroke: "#000000",
        strokeThickness: 9,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#00ff99",
          blur: 16,
          fill: true,
        },
      })
      .setOrigin(0.5);

    this.crashInfoText = this.add
      .text(
        LAYOUT.graphX,
        LAYOUT.graphY + 105,
        "Multiplier rises until the rocket crashes",
        {
          fontSize: "14px",
          fontStyle: "bold",
          color: "#ffe9a6",
          stroke: "#000000",
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5);
  }

  drawGrid() {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0xffd700, 0.18);

    for (let i = 0; i <= 5; i++) {
      const x = Phaser.Math.Linear(this.graphLeft, this.graphRight, i / 5);
      this.gridGraphics.lineBetween(x, this.graphTop, x, this.graphBottom);
    }

    for (let i = 0; i <= 4; i++) {
      const y = Phaser.Math.Linear(this.graphTop, this.graphBottom, i / 4);
      this.gridGraphics.lineBetween(this.graphLeft, y, this.graphRight, y);
    }

    this.gridGraphics.lineStyle(3, 0xffd700, 0.6);

    this.gridGraphics.lineBetween(
      this.graphLeft,
      this.graphBottom,
      this.graphRight,
      this.graphBottom,
    );

    this.gridGraphics.lineBetween(
      this.graphLeft,
      this.graphBottom,
      this.graphLeft,
      this.graphTop,
    );
  }

  createRocket() {
    this.rocketFlame = this.add
      .text(0, 0, "🔥", {
        fontSize: "24px",
      })
      .setOrigin(0.5);

    this.rocket = this.add
      .text(this.graphLeft, this.graphBottom, "🚀", {
        fontSize: "42px",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.rocketFlame.setPosition(this.rocket.x - 20, this.rocket.y + 22);
  }

  createStatusBox() {
    this.statusBox = this.createPanel(
      LAYOUT.statusX,
      LAYOUT.statusY,
      LAYOUT.statusW,
      LAYOUT.statusH,
      0x180006,
      0.96,
    );

    this.statusText = this.add
      .text(LAYOUT.statusX, LAYOUT.statusY, "Ready", {
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffe9a6",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
  }

  setStatus(value, baseFontSize = 20) {
    fitTextToBox(this.statusText, value, LAYOUT.statusW - 30, baseFontSize, 12);
  }

  createBottomPanels() {
    this.createPanel(
      LAYOUT.balanceX,
      LAYOUT.balanceY,
      LAYOUT.balanceW,
      LAYOUT.balanceH,
    );

    this.add
      .text(LAYOUT.balanceX, LAYOUT.balanceY - 12, "BALANCE", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffe9a6",
      })
      .setOrigin(0.5);

    this.balanceValue = this.add
      .text(
        LAYOUT.balanceX,
        LAYOUT.balanceY + 11,
        this.formatMoney(this.balance),
        {
          fontSize: "20px",
          fontStyle: "bold",
          color: "#ffffff",
        },
      )
      .setOrigin(0.5);

    this.createPanel(LAYOUT.betX, LAYOUT.betY, LAYOUT.betW, LAYOUT.betH);

    this.add
      .text(LAYOUT.betX, LAYOUT.betY - 12, "BET", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffe9a6",
      })
      .setOrigin(0.5);

    this.betMinus = this.add
      .circle(LAYOUT.betX - 58, LAYOUT.betY + 10, 13, 0x300000)
      .setStrokeStyle(2, 0xffd700)
      .setInteractive({ useHandCursor: true });

    this.betMinusText = this.add
      .text(LAYOUT.betX - 58, LAYOUT.betY + 10, "-", {
        fontSize: "19px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    this.betPlus = this.add
      .circle(LAYOUT.betX + 58, LAYOUT.betY + 10, 13, 0x300000)
      .setStrokeStyle(2, 0xffd700)
      .setInteractive({ useHandCursor: true });

    this.betPlusText = this.add
      .text(LAYOUT.betX + 58, LAYOUT.betY + 9, "+", {
        fontSize: "18px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    this.betValue = this.add
      .text(LAYOUT.betX, LAYOUT.betY + 10, this.formatMoney(this.bet), {
        fontSize: "19px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.betMinus.on("pointerdown", () => this.changeBet(-this.betStep));
    this.betPlus.on("pointerdown", () => this.changeBet(this.betStep));

    this.createPanel(
      LAYOUT.lastWinX,
      LAYOUT.lastWinY,
      LAYOUT.lastWinW,
      LAYOUT.lastWinH,
    );

    this.add
      .text(LAYOUT.lastWinX, LAYOUT.lastWinY - 12, "LAST WIN", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffe9a6",
      })
      .setOrigin(0.5);

    this.lastWinValue = this.add
      .text(
        LAYOUT.lastWinX,
        LAYOUT.lastWinY + 11,
        this.formatMoney(this.lastWin),
        {
          fontSize: "20px",
          fontStyle: "bold",
          color: "#ffffff",
        },
      )
      .setOrigin(0.5);
  }

  createActionButton() {
    this.actionButton = this.add
      .rectangle(
        LAYOUT.actionX,
        LAYOUT.actionY,
        LAYOUT.actionW,
        LAYOUT.actionH,
        0xce0023,
        1,
      )
      .setStrokeStyle(5, 0xffd700)
      .setInteractive({ useHandCursor: true });

    this.actionText = this.add
      .text(LAYOUT.actionX, LAYOUT.actionY - 7, "BET", {
        fontSize: "29px",
        fontStyle: "bold",
        color: "#ffe9a6",
        stroke: "#4a0000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.actionSubText = this.add
      .text(LAYOUT.actionX, LAYOUT.actionY + 23, "SPACE", {
        fontSize: "10px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.actionButton.on("pointerdown", () => {
      this.sfx.click();
      this.handleActionInput();
    });

    this.actionButton.on("pointerover", () => {
      this.actionButton.setFillStyle(this.roundActive ? 0x00b86b : 0xff173e);
    });

    this.actionButton.on("pointerout", () => {
      this.updateActionButton();
    });

    this.tweens.add({
      targets: [this.actionButton, this.actionText, this.actionSubText],
      scale: 1.03,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  createSoundButton() {
    this.soundButton = this.add
      .rectangle(
        LAYOUT.soundX,
        LAYOUT.soundY,
        LAYOUT.soundW,
        LAYOUT.soundH,
        0x120006,
        0.96,
      )
      .setStrokeStyle(3, 0xffd700)
      .setInteractive({ useHandCursor: true });

    this.soundText = this.add
      .text(LAYOUT.soundX, LAYOUT.soundY, "SOUND: ON", {
        fontSize: "11px",
        fontStyle: "bold",
        color: "#ffe9a6",
      })
      .setOrigin(0.5);

    this.soundButton.on("pointerdown", () => {
      const willEnable = !this.sfx.enabled;
      this.sfx.enabled = willEnable;

      if (willEnable) {
        this.soundButton.setFillStyle(0x120006);
        this.soundText.setColor("#ffe9a6");
        this.soundText.setText("SOUND: ON");
        this.sfx.click();
      } else {
        this.soundButton.setFillStyle(0xffc400);
        this.soundText.setColor("#190000");
        this.soundText.setText("SOUND: OFF");
      }
    });
  }

  createKeyboardControls() {
    this.input.keyboard.on("keydown-SPACE", () => {
      this.sfx.click();
      this.handleActionInput();
    });
  }

  createAmbientAnimations() {
    this.tweens.add({
      targets: this.rocketFlame,
      scale: 1.25,
      alpha: 0.55,
      duration: 120,
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: this.multiplierText,
      scale: 1.04,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  updateDisplay() {
    fitTextToBox(
      this.balanceValue,
      this.formatMoney(this.balance),
      LAYOUT.balanceW - 35,
      20,
      12,
    );

    fitTextToBox(
      this.betValue,
      this.formatMoney(this.bet),
      LAYOUT.betW - 90,
      19,
      12,
    );

    fitTextToBox(
      this.lastWinValue,
      this.formatMoney(this.lastWin),
      LAYOUT.lastWinW - 35,
      20,
      12,
    );

    if (this.multiplierText) {
      const color = this.roundActive ? "#00ff99" : "#ffd700";

      this.multiplierText.setColor(color);

      fitTextToBox(
        this.multiplierText,
        this.formatMultiplier(this.multiplier),
        360,
        58,
        30,
      );
    }

    this.updateActionButton();
  }

  updateActionButton() {
    if (!this.actionButton || !this.actionText || !this.actionSubText) return;

    if (this.roundActive && this.hasBet && !this.hasCashedOut) {
      this.actionButton.setFillStyle(0x00a85a);
      this.actionText.setText("CASH OUT");
      this.actionText.setFontSize(21);
      this.actionSubText.setText(this.formatMultiplier(this.multiplier));
      return;
    }

    this.actionButton.setFillStyle(0xce0023);
    this.actionText.setText("BET");
    this.actionText.setFontSize(29);
    this.actionSubText.setText("SPACE");
  }

  changeBet(amount) {
    if (this.roundActive) return;

    this.sfx.click();

    this.bet = Phaser.Math.Clamp(this.bet + amount, this.minBet, this.maxBet);

    this.updateDisplay();

    this.tweens.add({
      targets: this.betValue,
      scale: 1.18,
      duration: 120,
      yoyo: true,
    });
  }

  setBetButtonsEnabled(enabled) {
    if (!this.betMinus || !this.betPlus) return;

    const alpha = enabled ? 1 : 0.45;

    this.betMinus.disableInteractive();
    this.betPlus.disableInteractive();

    if (enabled) {
      this.betMinus.setInteractive({ useHandCursor: true });
      this.betPlus.setInteractive({ useHandCursor: true });
    }

    [this.betMinus, this.betPlus, this.betMinusText, this.betPlusText].forEach(
      (item) => {
        item.setAlpha(alpha);
      },
    );
  }

  handleActionInput() {
    if (this.inputLocked) return;

    this.inputLocked = true;

    this.time.delayedCall(180, () => {
      this.inputLocked = false;
    });

    if (!this.roundActive) {
      this.startRound();
      return;
    }

    if (this.roundActive && this.hasBet && !this.hasCashedOut) {
      this.cashOut();
    }
  }

  startRound() {
    if (this.balance < this.bet) {
      this.setStatus("Not enough balance!");
      this.sfx.crash();
      return;
    }

    this.balance -= this.bet;
    this.lastWin = 0;
    this.multiplier = 1;
    this.elapsed = 0;
    this.crashPoint = this.generateCrashPoint();

    this.roundActive = true;
    this.hasBet = true;
    this.hasCashedOut = false;
    this.graphPoints = [];

    this.lineGraphics.clear();
    this.setBetButtonsEnabled(false);
    this.setStatus("Rocket launched! Cash out before crash", 18);
    this.resetRocket();
    this.updateDisplay();

    this.cameras.main.shake(120, 0.002);
  }

  generateCrashPoint() {
    const roll = Math.random();

    if (roll < 0.08) return Phaser.Math.FloatBetween(1.01, 1.2);
    if (roll < 0.55) return Phaser.Math.FloatBetween(1.25, 2.4);
    if (roll < 0.85) return Phaser.Math.FloatBetween(2.4, 5.5);
    if (roll < 0.97) return Phaser.Math.FloatBetween(5.5, 12);

    return Phaser.Math.FloatBetween(12, 25);
  }

  calculateMultiplier(elapsed) {
    const value = Math.exp(elapsed * this.roundSpeed);

    return Math.max(1, value);
  }

  updateGraph() {
    const progress = Phaser.Math.Clamp(this.elapsed / 9000, 0, 1);

    const normalizedMultiplier = Phaser.Math.Clamp(
      (this.multiplier - 1) / 8,
      0,
      1,
    );

    const x = Phaser.Math.Linear(this.graphLeft, this.graphRight, progress);

    const y = Phaser.Math.Linear(
      this.graphBottom,
      this.graphTop,
      normalizedMultiplier,
    );

    this.graphPoints.push({ x, y });

    if (this.graphPoints.length > 180) {
      this.graphPoints.shift();
    }

    this.lineGraphics.clear();
    this.lineGraphics.lineStyle(5, 0x00ff99, 1);

    if (this.graphPoints.length > 1) {
      this.lineGraphics.beginPath();
      this.lineGraphics.moveTo(this.graphPoints[0].x, this.graphPoints[0].y);

      for (let i = 1; i < this.graphPoints.length; i++) {
        this.lineGraphics.lineTo(this.graphPoints[i].x, this.graphPoints[i].y);
      }

      this.lineGraphics.strokePath();
    }
  }

  updateRocketPosition() {
    if (this.graphPoints.length === 0) return;

    const point = this.graphPoints[this.graphPoints.length - 1];

    this.rocket.setPosition(point.x, point.y);
    this.rocket.setAngle(-18);
    this.rocketFlame.setPosition(point.x - 22, point.y + 26);
  }

  resetRocket() {
    this.rocket.setPosition(this.graphLeft, this.graphBottom);
    this.rocket.setAngle(0);
    this.rocket.setAlpha(1);
    this.rocket.setScale(1);

    this.rocketFlame.setPosition(this.graphLeft - 20, this.graphBottom + 22);
    this.rocketFlame.setAlpha(1);
    this.rocketFlame.setScale(1);
  }

  cashOut() {
    if (!this.roundActive || this.hasCashedOut) return;

    this.hasCashedOut = true;

    const win = this.bet * this.multiplier;

    this.balance += win;
    this.lastWin = win;

    this.setStatus(
      `CASHED OUT +${this.formatMoney(win)} at ${this.formatMultiplier(this.multiplier)}`,
      16,
    );

    this.sfx.cashOut();
    this.updateDisplay();

    this.tweens.add({
      targets: this.lastWinValue,
      scale: 1.18,
      duration: 140,
      yoyo: true,
      repeat: 2,
    });
  }

  crashRound() {
    if (!this.roundActive) return;

    this.roundActive = false;
    this.setBetButtonsEnabled(true);

    this.multiplier = this.crashPoint;
    this.updateDisplay();

    this.drawCrashLine();

    if (this.hasCashedOut) {
      this.setStatus(
        `Round crashed at ${this.formatMultiplier(this.crashPoint)} — you already cashed out`,
        15,
      );
    } else {
      this.setStatus(
        `CRASHED at ${this.formatMultiplier(this.crashPoint)} — lost ${this.formatMoney(this.bet)}`,
        16,
      );
      this.sfx.crash();
    }

    this.playCrashAnimation();
    this.scheduleRoundReset();
  }

  drawCrashLine() {
    this.lineGraphics.clear();
    this.lineGraphics.lineStyle(6, 0xff2d2d, 1);

    if (this.graphPoints.length > 1) {
      this.lineGraphics.beginPath();
      this.lineGraphics.moveTo(this.graphPoints[0].x, this.graphPoints[0].y);

      for (let i = 1; i < this.graphPoints.length; i++) {
        this.lineGraphics.lineTo(this.graphPoints[i].x, this.graphPoints[i].y);
      }

      this.lineGraphics.strokePath();
    }
  }

  playCrashAnimation() {
    this.cameras.main.flash(350, 255, 45, 45);
    this.cameras.main.shake(450, 0.009);

    this.tweens.add({
      targets: [this.rocket, this.rocketFlame],
      alpha: 0,
      scale: 1.5,
      angle: 45,
      duration: 450,
      ease: "Cubic.easeOut",
    });

    for (let i = 0; i < 32; i++) {
      const spark = this.add
        .text(this.rocket.x, this.rocket.y, "✦", {
          fontSize: `${Phaser.Math.Between(14, 24)}px`,
          color: "#ffd700",
          stroke: "#7a0000",
          strokeThickness: 3,
        })
        .setOrigin(0.5);

      this.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-180, 180),
        y: spark.y + Phaser.Math.Between(-140, 140),
        alpha: 0,
        scale: 1.8,
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(500, 1000),
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  scheduleRoundReset() {
    this.time.delayedCall(1400, () => {
      this.hasBet = false;
      this.hasCashedOut = false;
      this.multiplier = 1;
      this.elapsed = 0;
      this.graphPoints = [];

      this.lineGraphics.clear();
      this.resetRocket();
      this.setStatus("Place your bet and launch the rocket");
      this.updateDisplay();
    });
  }
}
