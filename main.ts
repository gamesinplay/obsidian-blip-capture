import { App, Modal, Plugin, TFile, Notice } from 'obsidian';

const BLIPS_FILE = 'Blips.md';

interface Blip {
	date: string;
	content: string;
	index: number;
}

function padTwo(value: number): string {
	return value < 10 ? `0${value}` : `${value}`;
}

function formatBlipLine(blip: Blip): string {
	return `- **${blip.content}** ${blip.date}`;
}

export default class BlipCapturePlugin extends Plugin {
	onload() {
		// Ribbon icon for capturing
		this.addRibbonIcon('zap', 'Capture blip', () => {
			new BlipModal(this.app, this).open();
		});

		// Ribbon icon for managing blips
		this.addRibbonIcon('list', 'Manage blips', () => {
			new ManageBlipsModal(this.app, this).open();
		});

		// Ribbon icon for random blip
		this.addRibbonIcon('dice', 'Random blip', () => {
			new RandomBlipModal(this.app, this).open();
		});

		this.addCommand({
			id: 'capture-blip',
			name: 'Capture a new blip',
			callback: () => {
				new BlipModal(this.app, this).open();
			}
		});

		this.addCommand({
			id: 'manage-blips',
			name: 'Manage blips (view and delete)',
			callback: () => {
				new ManageBlipsModal(this.app, this).open();
			}
		});

		this.addCommand({
			id: 'random-blip',
			name: 'Show a random blip',
			callback: () => {
				new RandomBlipModal(this.app, this).open();
			}
		});
	}

	async saveBlip(content: string): Promise<void> {
		const date = this.formatDate(new Date());
		const blipEntry = `- **${content}** ${date}`;

		const file = this.app.vault.getAbstractFileByPath(BLIPS_FILE);

		if (file instanceof TFile) {
			// File exists - prepend new blip after the leading blank line
			const existingContent = await this.app.vault.read(file);
			const trimmed = existingContent.replace(/^\s+/, '');
			await this.app.vault.modify(file, `\n${blipEntry}\n${trimmed}`);
		} else {
			// File doesn't exist - create it with a leading blank line
			await this.app.vault.create(BLIPS_FILE, `\n${blipEntry}`);
		}

		new Notice('Blip saved');
	}

	async getBlips(): Promise<Blip[]> {
		const file = this.app.vault.getAbstractFileByPath(BLIPS_FILE);
		if (!(file instanceof TFile)) {
			return [];
		}

		const content = await this.app.vault.cachedRead(file);
		const blips: Blip[] = [];

		const lines = content.split('\n').filter((line) => line.trim() !== '');

		// Matches: - **bold content** MM/DD/YY
		const blipPattern = /^-\s+\*\*(.+)\*\*\s+(\d{2}\/\d{2}\/\d{2})$/;

		let index = 0;
		for (const line of lines) {
			const match = blipPattern.exec(line);
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

		await this.app.vault.modify(file, this.serializeBlips(remainingBlips));
		new Notice('Blip deleted');
	}

	async reorderBlips(blips: Blip[]): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(BLIPS_FILE);
		if (!(file instanceof TFile)) {
			return;
		}

		await this.app.vault.modify(file, this.serializeBlips(blips));
		new Notice('Blips reordered');
	}

	serializeBlips(blips: Blip[]): string {
		return `\n${blips.map(formatBlipLine).join('\n')}`;
	}

	formatDate(date: Date): string {
		const month = padTwo(date.getMonth() + 1);
		const day = padTwo(date.getDate());
		const year = `${date.getFullYear()}`.slice(-2);
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

	onOpen(): void {
		const { contentEl } = this;

		contentEl.addClass('blip-modal');

		contentEl.createEl('h3', { text: 'Capture blip', cls: 'blip-title' });

		this.textArea = contentEl.createEl('textarea', {
			cls: 'blip-textarea',
			attr: {
				placeholder: 'Type your blip here...',
				rows: '5'
			}
		});

		const buttonContainer = contentEl.createDiv({ cls: 'blip-button-container' });

		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			cls: 'blip-button blip-cancel'
		});
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		const saveButton = buttonContainer.createEl('button', {
			text: 'Save',
			cls: 'blip-button blip-save'
		});
		saveButton.addEventListener('click', () => {
			void this.saveBlip();
		});

		this.textArea.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				void this.saveBlip();
			}
			if (e.key === 'Escape') {
				this.close();
			}
		});

		this.textArea.focus();
	}

	async saveBlip(): Promise<void> {
		const content = this.textArea.value.trim();

		if (!content) {
			new Notice('Please enter some content for your blip.');
			return;
		}

		await this.plugin.saveBlip(content);
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

class ManageBlipsModal extends Modal {
	plugin: BlipCapturePlugin;
	blipsContainer: HTMLElement;
	blips: Blip[] = [];
	draggedItem: HTMLElement | null = null;
	draggedIndex = -1;

	constructor(app: App, plugin: BlipCapturePlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.addClass('blip-modal');
		contentEl.addClass('blip-manage-modal');

		contentEl.createEl('h3', { text: 'Manage blips', cls: 'blip-title' });

		contentEl.createEl('p', {
			text: 'Drag to reorder • Click × to delete',
			cls: 'blip-instructions'
		});

		this.blipsContainer = contentEl.createDiv({ cls: 'blips-list-container' });

		const buttonContainer = contentEl.createDiv({ cls: 'blip-button-container' });
		const closeButton = buttonContainer.createEl('button', {
			text: 'Close',
			cls: 'blip-button blip-cancel'
		});
		closeButton.addEventListener('click', () => {
			this.close();
		});

		void this.renderBlips();
	}

	async renderBlips(): Promise<void> {
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

			const dragHandle = blipItem.createDiv({ cls: 'blip-drag-handle' });
			dragHandle.setText('⋮⋮');

			const blipContent = blipItem.createDiv({ cls: 'blip-item-content' });
			blipContent.createDiv({
				text: blip.content.length > 80 ? `${blip.content.substring(0, 80)}...` : blip.content,
				cls: 'blip-item-text'
			});
			blipContent.createDiv({
				text: blip.date,
				cls: 'blip-item-date'
			});

			const deleteButton = blipItem.createEl('button', {
				text: '×',
				cls: 'blip-delete-button',
				attr: { 'aria-label': 'Delete blip' }
			});
			deleteButton.addEventListener('click', (e) => {
				e.stopPropagation();
				void this.removeBlip(i);
			});

			blipItem.addEventListener('dragstart', (e) => {
				this.handleDragStart(e, i);
			});
			blipItem.addEventListener('dragend', () => {
				this.handleDragEnd();
			});
			blipItem.addEventListener('dragover', (e) => {
				this.handleDragOver(e);
			});
			blipItem.addEventListener('drop', (e) => {
				void this.handleDrop(e, i);
			});
			blipItem.addEventListener('dragenter', (e) => {
				this.handleDragEnter(e);
			});
			blipItem.addEventListener('dragleave', (e) => {
				this.handleDragLeave(e);
			});
		}
	}

	async removeBlip(index: number): Promise<void> {
		await this.plugin.deleteBlip(index);
		await this.renderBlips();
	}

	handleDragStart(e: DragEvent, index: number): void {
		this.draggedIndex = index;
		this.draggedItem = e.target as HTMLElement;
		this.draggedItem.addClass('blip-dragging');

		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}

	handleDragEnd(): void {
		if (this.draggedItem) {
			this.draggedItem.removeClass('blip-dragging');
		}
		this.draggedItem = null;
		this.draggedIndex = -1;

		const items = this.blipsContainer.querySelectorAll('.blip-item');
		items.forEach((item) => {
			item.removeClass('blip-drag-over');
		});
	}

	handleDragOver(e: DragEvent): void {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	handleDragEnter(e: DragEvent): void {
		const target = (e.target as HTMLElement).closest('.blip-item');
		if (target && target !== this.draggedItem) {
			target.addClass('blip-drag-over');
		}
	}

	handleDragLeave(e: DragEvent): void {
		const target = (e.target as HTMLElement).closest('.blip-item');
		if (target) {
			target.removeClass('blip-drag-over');
		}
	}

	async handleDrop(e: DragEvent, dropIndex: number): Promise<void> {
		e.preventDefault();

		if (this.draggedIndex === -1 || this.draggedIndex === dropIndex) {
			return;
		}

		const draggedBlip = this.blips[this.draggedIndex];
		this.blips.splice(this.draggedIndex, 1);
		this.blips.splice(dropIndex, 0, draggedBlip);

		await this.plugin.reorderBlips(this.blips);
		await this.renderBlips();
	}

	onClose(): void {
		this.contentEl.empty();
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

	onOpen(): void {
		const { contentEl } = this;

		contentEl.addClass('blip-modal');
		contentEl.addClass('blip-random-modal');

		contentEl.createEl('h3', { text: 'Random blip', cls: 'blip-title' });

		this.blipDisplay = contentEl.createDiv({ cls: 'random-blip-display' });

		const buttonContainer = contentEl.createDiv({ cls: 'blip-button-container' });

		const anotherButton = buttonContainer.createEl('button', {
			text: 'Another',
			cls: 'blip-button blip-save'
		});
		anotherButton.addEventListener('click', () => {
			this.showRandomBlip();
		});

		const closeButton = buttonContainer.createEl('button', {
			text: 'Close',
			cls: 'blip-button blip-cancel'
		});
		closeButton.addEventListener('click', () => {
			this.close();
		});

		void this.loadBlips();
	}

	async loadBlips(): Promise<void> {
		this.blips = await this.plugin.getBlips();
		this.showRandomBlip();
	}

	showRandomBlip(): void {
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

		this.blipDisplay.createDiv({
			text: blip.content,
			cls: 'random-blip-content'
		});
		this.blipDisplay.createDiv({
			text: blip.date,
			cls: 'random-blip-date'
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
