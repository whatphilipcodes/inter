import { Store } from '../state/store'
import config from '../front.config'

export default class Input extends HTMLElement {
	state: Store

	textarea: HTMLTextAreaElement

	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		const template = document.createElement('template')
		template.innerHTML = /*html*/ `
			<style scoped>
				#hiddenInput {
					opacity: ${config.showHiddenInput ? 100 : 0};
					position: absolute;
					bottom: 0;
					left: 0;
					pointer-events: ${config.showHiddenInput ? 'auto' : 'none'};
				}
			</style>
			<textarea
				id="hiddenInput"
				type="text"
				autocomplete="off"
				autocorrect="off"
				maxlength="${config.maxInputLength}"
			></textarea>
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

		// prevent space or enter as first char
		this.textarea.addEventListener('keydown', function (e: KeyboardEvent) {
			if (this.value.length !== 0) return
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault()
			}
		})
	}

	// connect input to global state
	initInput(globalState: Store) {
		this.state = globalState
		// update input value
		this.textarea.addEventListener('input', (e: Event) => {
			const target = e.target as HTMLTextAreaElement
			this.state.mutate({ input: target.value })
		})

		// update cursor position
		this.textarea.addEventListener('keydown', async (e) => {
			await new Promise((resolve) => setTimeout(resolve, 0))
			switch (e.key) {
				case 'ArrowUp':
					e.preventDefault()
					this.state.mutate({ specialKeyPressed: 'ArrowUp' })
					this.textarea.setSelectionRange(
						this.state.cursorPos,
						this.state.cursorPos
					)
					break
				case 'ArrowDown':
					e.preventDefault()
					this.state.mutate({ specialKeyPressed: 'ArrowDown' })
					this.textarea.setSelectionRange(
						this.state.cursorPos,
						this.state.cursorPos
					)
					break
				default:
					this.state.mutate({ cursorPos: this.textarea.selectionStart })
					break
			}

			// if (this.textarea.selectionStart === this.textarea.selectionEnd) {
			// 	state.mutate({ selectionActive: false })
			// }
		})

		// // update selection
		// this.textarea.addEventListener('select', async () => {
		// 	await new Promise((resolve) => setTimeout(resolve, 0))
		// 	const target = this.textarea
		// 	state.mutate({ cursorPos: target.selectionStart })
		// 	if (target.selectionStart === target.selectionEnd) {
		// 		state.mutate({ selectionActive: false })
		// 	}
		// })
	}
}

customElements.define('input-el', Input)
