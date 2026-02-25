import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="px-4 py-2 rounded-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
      [disabled]="disabled"
      (click)="onClick()"
      aria-live="polite"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input() disabled = false;
  @Output() clickEvent = new EventEmitter<void>();

  onClick() {
    if (!this.disabled) this.clickEvent.emit();
  }
}

