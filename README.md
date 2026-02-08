Blip Capture Plugin for Obsidian
Quickly capture short notes ("Blips") and save them to a central Blips.md file in your vault's root directory. View a random blip for inspiration or manage your collection with drag-and-drop reordering.
Features
• Capture Blips: Quickly jot down thoughts, ideas, or notes via a popup modal
• Manage Blips: View, reorder (drag and drop), and delete blips
• Random Blip: Display a random blip from your collection for inspiration or review
• Ribbon Icons: Three icons in the left sidebar for quick access
• Hotkey Support: Assign custom hotkeys to all functions
• Keyboard Shortcuts: Ctrl/Cmd + Enter to save, Escape to cancel
Ribbon Icons
• ? Capture Blip — Open the capture modal to add a new blip
• ? Manage Blips — View, reorder, and delete blips
• ?? Random Blip — Display a random blip from your collection
Installation
1. Create a folder called blip-capture in your vault's .obsidian/plugins/ directory
2. Copy these three files into that folder:
– main.js
– manifest.json
– styles.css
3. Reload Obsidian
4. Go to Settings ? Community plugins ? Enable "Blip Capture"
Setting Hotkeys
1. Go to Settings ? Hotkeys
2. Search for "Blip" to find the commands:
– Capture a new Blip
– Manage Blips (view and delete)
– Show a random Blip
3. Click the + button to assign your preferred key combinations
Blip File Format
Blips are stored in Blips.md in your vault's root directory as a bulleted list. Each blip shows bold text followed by a date stamp:
markdown

- My first blip content here 02/04/26
- Another thought I captured 02/03/26
- An older blip 01/28/26
The file always begins with a blank line. In Obsidian's preview mode, blips display as a clean bulleted list with bold content.
Usage
Capturing a Blip
1. Click the ? icon or use your hotkey
2. Type your blip in the text area
3. Click "Save" or press Ctrl/Cmd + Enter
Managing Blips
1. Click the ? icon or use your hotkey
2. Drag blips using the handle (??) to reorder
3. Click × to delete a blip
Random Blip
1. Click the ?? icon or use your hotkey
2. View a random blip from your collection
3. Click "Another" to see a different random blip
Files
• main.js — Compiled plugin code
• manifest.json — Plugin metadata
• styles.css — Modal styling
