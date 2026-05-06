# Crash Rocket Game Demo

A responsive HTML5 crash-style game built with Phaser 3 and plain JavaScript.

## Features

- Live multiplier system
- Animated rocket movement
- Rising graph line
- Bet and cash out gameplay
- Random crash point generation
- Balance and bet management
- Last win display
- Sound ON/OFF control
- Win/loss logic
- Crash animation with screen shake and spark effects
- Responsive canvas scaling for different screen sizes

## Tech Stack

- Phaser 3
- JavaScript
- HTML5
- CSS

## How to Run

Open `index.html` directly in the browser.

You can also deploy the project to any static hosting platform, such as:

- Cloudflare Pages
- Netlify
- Vercel
- GitHub Pages

## Game Logic

The player places a bet and launches the rocket.

The multiplier starts at `1.00x` and increases in real time.  
The player must cash out before the rocket crashes.

- Cash out before crash = win `bet * multiplier`
- Crash before cash out = lose the bet

Example:

```text
Bet: 50
Cash out at: 2.30x
Win: 115.00