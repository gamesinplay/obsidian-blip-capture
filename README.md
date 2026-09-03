# Blip Capture 1.1.0 Plugin for Obsidian

Quickly capture short notes ("Blips") and save them to a central `Blips.md` file in your vault's root directory. Perfect for capturing fleeting thoughts, ideas, and quick notes without interrupting your workflow.

## Features

- **Capture Blips**: Quickly jot down thoughts, ideas, or notes via a popup modal
- **Manage Blips**: View, reorder (drag and drop), and delete blips
- **Random Blip**: Display a random blip from your collection for inspiration or review
- **Ribbon Icons**: Three icons in the left sidebar for quick access
- **Hotkey Support**: Assign custom hotkeys to all functions
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + Enter` to save
  - `Escape` to cancel

## Installation

### From Obsidian Community Plugins

1. Open Obsidian and go to **Settings → Community Plugins**
2. Click **Browse** and search for "Blip Capture"
3. Click **Install**, then **Enable**

### Manual Installation

1. Create a folder called `blip-capture` in your vault's `.obsidian/plugins/` directory
2. Copy these three files into that folder:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Reload Obsidian (`Cmd/Ctrl + R`)
4. Go to **Settings → Community Plugins** and enable "Blip Capture"

## Usage

### Ribbon Icons

- **⚡ Capture Blip** — Open the capture modal to add a new blip
- **📋 Manage Blips** — View, reorder, and delete blips
- **🎲 Random Blip** — Display a random blip from your collection

### Capturing a Blip

1. Click the **⚡ Capture Blip** icon or use your assigned hotkey
2. Type your blip in the text area
3. Click **Save** or press `Ctrl/Cmd + Enter`
4. Your blip is instantly saved to `Blips.md`

### Managing Blips

1. Click the **📋 Manage Blips** icon or use your assigned hotkey
2. **Reorder**: Drag blips using the handle (⋮⋮) to change their order
3. **Delete**: Click the **×** button to remove a blip
4. Changes are saved automatically

### Viewing a Random Blip

1. Click the **🎲 Random Blip** icon or use your assigned hotkey
2. View a random blip from your collection
3. Click **Another** to see a different random blip
4. Click **Close** when done

### Setting Custom Hotkeys

1. Go to **Settings → Hotkeys**
2. Search for "Blip" to find the commands:
   - **Capture a new Blip**
   - **Manage Blips (view and delete)**
   - **Show a random Blip**
3. Click the **+** button to assign your preferred key combinations

## Blip File Format

Blips are stored in `Blips.md` in your vault's root directory as a bulleted list. Each blip shows bold text followed by a date stamp:

```markdown
- **My first blip content here** 02/04/26
- **Another thought I captured** 02/03/26
- **An older blip** 01/28/26
```

The file always begins with a blank line. In Obsidian's preview mode, blips display as a clean bulleted list with bold content.

## File Structure

- `main.js` — Compiled plugin code
- `manifest.json` — Plugin metadata
- `styles.css` — Modal styling
- `README.md` — Plugin documentation

## License

MIT

## Support

If you encounter any issues or have feature requests, please visit the [plugin repository](https://github.com/gamesinplay/obsidian-blip-capture).
