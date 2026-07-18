import { App, Modal, Setting, TextComponent } from 'obsidian';
import { COLLECTION_CONFIGS, type CollectionKey } from './lib/weatherTypes';

export class CreateNoteModal extends Modal {
  private titleInput: TextComponent | null = null;
  private ratingInput: TextComponent | null = null;
  private errorEl: HTMLElement | null = null;
  private submitting = false;

  constructor(
    app: App,
    private readonly collectionKey: CollectionKey,
    private readonly submitNote: (title: string, rating?: string) => Promise<void>
  ) {
    super(app);
  }

  onOpen(): void {
    const config = COLLECTION_CONFIGS[this.collectionKey];
    this.modalEl.addClass('vault-weather-create-modal');
    this.setTitle(config.addLabel);

    new Setting(this.contentEl)
      .setName(config.titleLabel)
      .addText((text) => {
        text.setPlaceholder(config.titleLabel);
        this.titleInput = text;
        text.inputEl.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') void this.submit();
        });
      });

    if (config.requiresRating) {
      new Setting(this.contentEl)
        .setName('Shelf rating')
        .setDesc('An integer from 0 to 5')
        .addText((text) => {
          text.setPlaceholder('0–5');
          text.inputEl.inputMode = 'numeric';
          this.ratingInput = text;
          text.inputEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') void this.submit();
          });
        });
    }

    this.errorEl = this.contentEl.createDiv({ cls: 'vault-weather-create-error' });
    new Setting(this.contentEl).addButton((button) =>
      button
        .setButtonText('Create and open')
        .setCta()
        .onClick(() => void this.submit())
    );

    window.setTimeout(() => this.titleInput?.inputEl.focus(), 0);
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async submit(): Promise<void> {
    if (this.submitting) return;
    this.submitting = true;
    this.errorEl?.setText('');

    try {
      await this.submitNote(this.titleInput?.getValue() ?? '', this.ratingInput?.getValue());
      this.close();
    } catch (error) {
      this.errorEl?.setText(error instanceof Error ? error.message : 'Could not create note');
    } finally {
      this.submitting = false;
    }
  }
}
