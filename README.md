# Crash Rocket Game Demo

A responsive HTML5 crash-style game built with Phaser 3 and modern JavaScript.

## Live Demo

https://cristianmarcu.ro/demo-games/crash-game-demo/

## GitHub Repository

https://github.com/cristianmarcu/phaser-crash-game-demo

---

## Features

- Live multiplier system
- Animated rocket movement
- Real-time graph rendering
- Bet and cash out gameplay
- Random crash point generation
- Balance and betting system
- Last win tracking
- Sound ON / OFF toggle
- Responsive UI layout
- Responsive canvas scaling
- Win and loss logic
- Crash animation effects
- Screen shake effects
- Spark particle effects
- Smooth animations and transitions
- Keyboard support (`SPACE` to bet / cash out)

---

## Tech Stack

- Phaser 3
- JavaScript (ES6 Modules)
- HTML5
- CSS

---

## Game Logic

The player places a bet and launches the rocket.

The multiplier starts at `1.00x` and increases in real time.

The player must cash out before the rocket crashes.

- Cash out before crash = win `bet × multiplier`
- Crash before cash out = lose the bet

### Example

```text
Bet: 50
Cash Out: 2.30x
Win: 115.00
```

---

## Project Structure

```text
project-folder/
├── index.html
├── src/
│   ├── audio/
│   │   └── SoundFX.js
│   ├── config/
│   │   ├── constants.js
│   │   └── layout.js
│   ├── scenes/
│   │   └── CrashGame.js
│   ├── utils/
│   │   └── text.js
│   └── main.js
├── README.md
└── .gitignore
```
