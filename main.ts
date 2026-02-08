import { App, Modal, Plugin, TFile, Notice } from 'obsidian';

const BLIPS_FILE = 'Blips.md';

interface Blip {
	date: string;
	content: string;
	index: number;
}

export default class BlipCapturePlugin extends Plugin {
	async onload() {
		// Add ribbon icon for capturing
		this.addRibbonIcon('zap', 'Capture Blip', () => {
			new BlipModal(this.app, this).open();
		});

		// Add ribbon icon for managing blips
		this.addRibbonIcon('list', 'Manage Blips', () => {
			new ManageBlipsModal(this.app, this).open();
		});

		// Add ribbon icon for random blip
		this.addRibbonIcon('dice', 'Random Blip', () => {
			new RandomBlipModal(this.app, this).open();
		});

		// Add command with hotkey support for capturing
		this.addCommand({
			id: 'capture-blip',
			name: 'Capture a new Blip',
			callback: () => {
				new BlipModal(this.app, this).open();
			}
		});

		// Add command for managing/deleting blips
		this.addCommand({
			id: 'manage-blips',
			name: 'Manage Blips (view and delete)',
			callback: () => {
				new ManageBlipsModal(this.app, this).open();
			}
		});

		// Add command for random blip
		this.addCommand({
			id: 'random-blip',
			name: 'Show a random Blip',
			callback: () => {
				new RandomBlipModal(this.app, this).open();
			}
		});
	}

	async saveBlip(content: string) {
		const date = this.formatDate(new Date());
		const blipEntry = `- **${content}** ${date}`;

		let file = this.app.vault.getAbstractFileByPath(BLIPS_FILE);

		if (file instanceof TFile) {
			// File exists - prepend new blip after the first blank line
			const existingContent = await this.app.vault.read(file);
			await this.app.vault.modify(file, `\n${blipEntry}\n${existingContent.trimStart()}`);
		} else {
			// File doesn't exist - create it with leading blank line
			await this.app.vault.create(BLIPS_FILE, `\n${blipEntry}`);
		}

		new Notice('Blip saved!');
	}

	async getBlips(): Promise<Blip[]> {
		const file = this.app.vault.getAbstractFileByPath(BLIPS_FILE);
		if (!(file instanceof TFile)) {
			return [];
		}

		const content = await this.app.vault.read(file);
		const blips: Blip[] = [];
		
		// Split by lines and filter out empty lines
		const lines = content.split('\n').filter(line => line.trim() !== '');
		
		// Pattern to match blip line: - **bold content** followed by MM/DD/YY at the end
		const blipPattern = /^-\s+\*\*(.+)\*\*\s+(\d{2}\/\d{2}\/\d{2})$/;
		
		let index = 0;
		for (const line of lines) {
			const match = line.match(blipPattern);
			if (match) {
				blips.push({
					content: match[1].trim(),
					date: match[2],
					index: index++
				});
			}
		}

		return blips;
	}

	async deleteBlip(blipIndex: number): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(BLIPS_FILE);
		if (!(file instanceof TFile)) {
			return;
		}

		const blips = await this.getBlips();
		const remainingBlips = blips.filter((_, i) => i !== blipIndex);
		
		const newContent = '\n' + remainingBlips
			.map(b => `- **${b.content}** ${b.date}`)
			.join('\n');

		await this.app.vault.modify(file, newContent);
		new Notice('Blip deleted!');
	}

	async reorderBlips(blips: Blip[]): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(BLIPS_FILE);
		if (!(file instanceof TFile)) {
			return;
		}

		const newContent = '\n' + blips
			.map(b => `- **${b.content}** ${b.date}`)
			.join('\n');

		await this.app.vault.modify(file, newContent);
		new Notice('Blips reordered!');
	}

	formatDate(date: Date): string {
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const year = String(date.getFullYear()).slice(-2);
		return `${month}/${day}/${year}`;
	}
}

class BlipModal extends Modal {
	plugin: BlipCapturePlugin;
	textArea: HTMLTextAreaElement;

	constructor(app: App, plugin: BlipCapturePlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		
		contentEl.addClass('blip-modal');
		
		// Title
		contentEl.createEl('h3', { text: 'Capture Blip', cls: 'blip-title' });

		// Text area for blip content
		this.textArea = contentEl.createEl('textarea', {
			cls: 'blip-textarea',
			attr: {
				placeholder: 'Type your blip here...',
				rows: '5'
			}
		});

		// Button container
		const buttonContainer = contentEl.createDiv({ cls: 'blip-button-container' });

		// Cancel button
		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			cls: 'blip-button blip-cancel'
		});
		cancelButton.addEventListener('click', () => this.close());

		// Save button
		const saveButton = buttonContainer.createEl('button', {
			text: 'Save',
			cls: 'blip-button blip-save'
		});
		saveButton.addEventListener('click', () => this.saveBlip());

		// Handle Enter key (Ctrl/Cmd + Enter to save)
		this.textArea.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				this.saveBlip();
			}
			if (e.key === 'Escape') {
				this.close();
			}
		});

		// Focus the text area
		this.textArea.focus();
	}

	async saveBlip() {
		const content = this.textArea.value.trim();
		
		if (!content) {
			new Notice('Please enter some content for your blip.');
			return;
		}

		await this.plugin.saveBlip(content);
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ManageBlipsModal extends Modal {
	plugin: BlipCapturePlugin;
	blipsContainer: HTMLElement;
	blips: Blip[] = [];
	draggedItem: HTMLElement | null = null;
	draggedIndex: number = -1;

	constructor(app: App, plugin: BlipCapturePlugin) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;
		
		contentEl.addClass('blip-modal');
		contentEl.addClass('blip-manage-modal');
		
		// Title
		contentEl.createEl('h3', { text: 'Manage Blips', cls: 'blip-title' });

		// Instructions
		contentEl.createEl('p', { 
			text: 'Drag to reorder • Click × to delete', 
			cls: 'blip-instructions' 
		});

		// Container for blips list
		this.blipsContainer = contentEl.createDiv({ cls: 'blips-list-container' });

		await this.renderBlips();

		// Close button
		const buttonContainer = contentEl.createDiv({ cls: 'blip-button-container' });
		const closeButton = buttonContainer.createEl('button', {
			text: 'Close',
			cls: 'blip-button blip-cancel'
		});
		closeButton.addEventListener('click', () => this.close());
	}

	async renderBlips() {
		this.blipsContainer.empty();
		
		this.blips = await this.plugin.getBlips();

		if (this.blips.length === 0) {
			this.blipsContainer.createEl('p', { 
				text: 'No blips yet.', 
				cls: 'blip-empty-message' 
			});
			return;
		}

		for (let i = 0; i < this.blips.length; i++) {
			const blip = this.blips[i];
			const blipItem = this.blipsContainer.createDiv({ cls: 'blip-item' });
			blipItem.setAttribute('draggable', 'true');
			blipItem.dataset.index = String(i);

			// Drag handle
			const dragHandle = blipItem.createDiv({ cls: 'blip-drag-handle' });
			dragHandle.innerHTML = '⋮⋮';

			const blipContent = blipItem.createDiv({ cls: 'blip-item-content' });
			blipContent.createEl('div', { 
				text: blip.content.length > 80 ? blip.content.substring(0, 80) + '...' : blip.content, 
				cls: 'blip-item-text' 
			});
			blipContent.createEl('div', { 
				text: blip.date, 
				cls: 'blip-item-date' 
			});

			const deleteButton = blipItem.createEl('button', {
				text: '×',
				cls: 'blip-delete-button',
				attr: { 'aria-label': 'Delete blip' }
			});
			deleteButton.addEventListener('click', async (e) => {
				e.stopPropagation();
				await this.plugin.deleteBlip(i);
				await this.renderBlips();
			});

			// Drag events
			blipItem.addEventListener('dragstart', (e) => this.handleDragStart(e, i));
			blipItem.addEventListener('dragend', (e) => this.handleDragEnd(e));
			blipItem.addEventListener('dragover', (e) => this.handleDragOver(e));
			blipItem.addEventListener('drop', (e) => this.handleDrop(e, i));
			blipItem.addEventListener('dragenter', (e) => this.handleDragEnter(e));
			blipItem.addEventListener('dragleave', (e) => this.handleDragLeave(e));
		}
	}

	handleDragStart(e: DragEvent, index: number) {
		this.draggedIndex = index;
		this.draggedItem = e.target as HTMLElement;
		this.draggedItem.addClass('blip-dragging');
		
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}

	handleDragEnd(e: DragEvent) {
		if (this.draggedItem) {
			this.draggedItem.removeClass('blip-dragging');
		}
		this.draggedItem = null;
		this.draggedIndex = -1;

		// Remove all drag-over classes
		const items = this.blipsContainer.querySelectorAll('.blip-item');
		items.forEach(item => {
			item.removeClass('blip-drag-over');
		});
	}

	handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	handleDragEnter(e: DragEvent) {
		const target = (e.target as HTMLElement).closest('.blip-item');
		if (target && target !== this.draggedItem) {
			target.addClass('blip-drag-over');
		}
	}

	handleDragLeave(e: DragEvent) {
		const target = (e.target as HTMLElement).closest('.blip-item');
		if (target) {
			target.removeClass('blip-drag-over');
		}
	}

	async handleDrop(e: DragEvent, dropIndex: number) {
		e.preventDefault();
		
		if (this.draggedIndex === -1 || this.draggedIndex === dropIndex) {
			return;
		}

		// Reorder the blips array
		const draggedBlip = this.blips[this.draggedIndex];
		this.blips.splice(this.draggedIndex, 1);
		this.blips.splice(dropIndex, 0, draggedBlip);

		// Save the new order
		await this.plugin.reorderBlips(this.blips);
		
		// Re-render
		await this.renderBlips();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class RandomBlipModal extends Modal {
	plugin: BlipCapturePlugin;
	blipDisplay: HTMLElement;
	blips: Blip[] = [];

	constructor(app: App, plugin: BlipCapturePlugin) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;
		
		contentEl.addClass('blip-modal');
		contentEl.addClass('blip-random-modal');
		
		// Title
		contentEl.createEl('h3', { text: 'Random Blip', cls: 'blip-title' });

		// Blip display area
		this.blipDisplay = contentEl.createDiv({ cls: 'random-blip-display' });

		// Load blips and show a random one
		this.blips = await this.plugin.getBlips();
		this.showRandomBlip();

		// Button container
		const buttonContainer = contentEl.createDiv({ cls: 'blip-button-container' });

		// Another button
		const anotherButton = buttonContainer.createEl('button', {
			text: 'Another',
			cls: 'blip-button blip-save'
		});
		anotherButton.addEventListener('click', () => this.showRandomBlip());

		// Close button
		const closeButton = buttonContainer.createEl('button', {
			text: 'Close',
			cls: 'blip-button blip-cancel'
		});
		closeButton.addEventListener('click', () => this.close());
	}

	showRandomBlip() {
		this.blipDisplay.empty();

		if (this.blips.length === 0) {
			this.blipDisplay.createEl('p', { 
				text: 'No blips yet.', 
				cls: 'blip-empty-message' 
			});
			return;
		}

		const randomIndex = Math.floor(Math.random() * this.blips.length);
		const blip = this.blips[randomIndex];

		this.blipDisplay.createEl('div', { 
			text: blip.content, 
			cls: 'random-blip-content' 
		});
		this.blipDisplay.createEl('div', { 
			text: blip.date, 
			cls: 'random-blip-date' 
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
