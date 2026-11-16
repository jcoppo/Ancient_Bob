# Ancient Bob

A small top-down game that runs in the browser. Grow food and gather materials for your village, and defend it from the barbarians. Explore new world areas for new resources.

The game is plain HTML, CSS, and JavaScript modules drawn on a canvas. There is no build step.

## Run it

From this folder, start a local server:

```bash
python3 -m http.server 8765
```

Then go to [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

Opening `index.html` as a file will not load the modules.

## Controls

| Key | Action |
| --- | --- |
| WASD or arrow keys | Move |
| Z or Space | Act: talk, pick up, use the held item, harvest |
| X | Drop the held item. In a menu or a yes/no question, go back |
| Enter | Open or close the menu |
| Up and down, or W and S | Move through menus and yes/no questions |
| Q | Show or hide the tile grid |

Music starts off. Use the button next to the title to turn it on.

## Playing

The village is on the left and the meadow is on the right. Walk off the side of the map to cross between them.

Talk to Bram, Lila, and Elder Otis in the village. The baker gives you a loaf the first time you speak. Later, if you are holding a wheat bundle, he will trade it for another loaf.

In the meadow, the farmer explains the tools. Hold the garden hoe and press Z on grass to turn it into soil. Hold the seed bag and press Z on soil to plant wheat. A plant grows through four stages, one every four seconds, then stops.

Press Z on wheat that is still growing to clear it. Press Z on fully grown wheat, with empty hands, to harvest a wheat bundle. Press X to set a held item on an empty tile. You cannot drop an item onto a tile that already has one.

The menu holds your items, a map, Save Game, and New Game. The save is stored in the browser under the key `ancient-bob`.

## Layout

- `index.html` is the page
- `css/game.css` is the layout
- `js/` is the game
- `assets/` holds the favicon and music
