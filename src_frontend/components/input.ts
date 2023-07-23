import { Store } from '../state/store'
import config from '../front.config'

export default class Input extends HTMLElement {
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

		// prevent space as first char
		this.textarea.addEventListener('keydown', function (e: KeyboardEvent) {
			if (e.key === ' ' && this.selectionStart === 0) {
				e.preventDefault()
			}
		})

		// // prevent key holding
		// const keys: { [key: string]: boolean } = {}
		// this.textarea.addEventListener('keydown', function (e) {
		// 	if (e.key === 'Backspace') return
		// 	if (e.key === 'ArrowUp') return
		// 	if (e.key === 'ArrowDown') return
		// 	if (e.key === 'ArrowLeft') return
		// 	if (e.key === 'ArrowRight') return
		// 	if (keys[e.key]) {
		// 		e.preventDefault()
		// 	} else {
		// 		keys[e.key] = true
		// 	}
		// })
		// this.textarea.addEventListener('keyup', function (e) {
		// 	keys[e.key] = false
		// })
	}

	// connect input to global state
	initInput(state: Store) {
		// update input value
		this.textarea.addEventListener('input', (e: Event) => {
			const target = e.target as HTMLTextAreaElement
			state.mutate({ input: target.value })
		})

		// update cursor position
		this.textarea.addEventListener('keydown', async () => {
			await new Promise((resolve) => setTimeout(resolve, 0))
			const target = this.textarea
			state.mutate({ cursorPos: target.selectionStart })
			if (target.selectionStart === target.selectionEnd) {
				state.mutate({ selectionActive: false })
			}
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

		state.subscribe('inputWidth', () => {
			this.textarea.style.width = `${state.inputWidth}px`
		})

		state.subscribe('fontSize', () => {
			this.textarea.style.fontSize = `${state.fontSize}px`
		})
	}
}

customElements.define('input-el', Input)
