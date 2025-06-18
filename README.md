# Flip7 Card Game

A digital implementation of the Flip7 press-your-luck card game for 1-7 players.

## How to Play

1. Open `index.html` in your web browser
2. Set the number of players (1-7) and target score
3. Enter player names
4. Click "Start Game"

### Game Rules

- **Objective**: Be the first to reach the target score (default: 200 points)
- **Scoring**: Points are based on the total value of number cards in front of you
- **Flip 7 Bonus**: Get 7 unique number cards for an automatic +15 bonus and round end
- **Bust**: Drawing a duplicate number card ends your turn with 0 points (unless you have Second Chance)

### Card Types

**Number Cards** (0-12): Your main source of points
- More valuable cards appear more frequently in the deck
- The 0 card is worth no points but helps achieve Flip 7

**Action Cards**:
- **Freeze**: Forces a player to stay and bank their points
- **Flip Three**: Forces a player to draw 3 cards
- **Second Chance**: Protects against one duplicate card

**Modifier Cards**:
- **+2, +4, +6, +8, +10**: Add bonus points to your number card total
- **x2**: Double your number card total

### Controls

- **Hit**: Draw another card
- **Stay**: Keep your current points and end your turn
- Click the deck to deal cards during your turn

## Features

- 1-7 player support
- Configurable target score
- Animated card dealing
- Real-time score tracking
- Action card effects
- Responsive design with Tailwind CSS

## Files

- `index.html`: Main game interface
- `game.js`: Game logic and mechanics
- `assets/`: Card images (not used in current implementation but available)
- `flip7_rules.pdf`: Official game rules

## Running the Game

### Option 1: Direct File
Simply open `index.html` in any modern web browser.

### Option 2: Local Server
```bash
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

The game works entirely in the browser with no server requirements.