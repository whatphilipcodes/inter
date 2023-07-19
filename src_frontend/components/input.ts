import { Store } from '../state/store'
import config from '../front.config'

export default class Input extends HTMLElement {
	textarea: HTMLTextAreaElement
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		const template = document.createElement('template')
		template.innerHTML = /*html*/ `
            <style>
                #hiddenInput {
					opacity: ${config.showHiddenInput ? 100 : 0};
					position: absolute;
					bottom: 0;
					left: 0;
					pointer-events: ${config.showHiddenInput ? 'auto' : 'none'};
                }
            </style>
            <div>
                <textarea id="hiddenInput" type="text" autocomplete="off" autocorrect="off" maxlength="${
									config.maxInputLength
								}"></textarea>
            </div>
        `
		this.shadowRoot.appendChild(template.content.cloneNode(true))
		this.textarea = this.shadowRoot.getElementById(
			'hiddenInput'
		) as HTMLTextAreaElement

		// keep focused
		if (!config.showHiddenInput) {
			this.textarea.addEventListener('blur', () => {
				this.textarea.focus()
			})
			this.textarea.focus()
		}
	}

	// connect input to global state
	initInput(state: Store) {
		this.textarea.addEventListener('input', (e: Event) => {
			const target = e.target as HTMLTextAreaElement
			state.mutate({ input: target.value })
		})
		this.textarea.addEventListener('keyup', (e: Event) => {
			const target = e.target as HTMLTextAreaElement
			state.mutate({ cursorPos: target.selectionStart })
			if (target.selectionStart == target.selectionEnd) {
				state.mutate({ selectionActive: false })
			}
		})
		this.textarea.addEventListener('select', (e: Event) => {
			const target = e.target as HTMLTextAreaElement
			state.mutate({
				selection: {
					start: target.selectionStart,
					end: target.selectionEnd,
				},
				selectionActive: target.selectionStart !== target.selectionEnd,
			})
		})
	}
}

customElements.define('input-el', Input)
