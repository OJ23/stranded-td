# Stranded

A choice-driven survival story set aboard a damaged spacecraft. Built with React,
Vite, React Router, and a data-driven game-state model.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm test
npm run build
```

The game autosaves to `localStorage` after every action. It supports keyboard
choice selection with the number keys, responsive mobile layouts, reversible
navigation, inventory-gated actions, oxygen and battery management, scanner
intel, and three endings.

## Architecture

- `src/data/story.js` stores scene and room content as data.
- `src/utils/gameState.js` contains pure state transitions and persistence.
- `src/components/` contains reusable interface pieces.
- `src/pages/` separates the title screen from the game.

The first release intentionally avoids scene typing and transition animation so
motion can be introduced later without changing the state model.
