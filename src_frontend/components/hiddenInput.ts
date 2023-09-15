import { State, ConvoType, InteractionState } from '../utils/types'
import { Store } from '../state/store'
import config from '../front.config'
import { getTimestamp, startTimer } from '../utils/misc'

export default class HiddenInput extends HTMLElement {
	state: Store
	textarea: HTMLTextAreaElement
	timer: () => void

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
			if (e.key === ' ') {
				e.preventDefault()
			}
		})
	}

	// connect input to global state
	initInput(globalState: Store) {
		this.state = globalState
		// update input value (has to be seperate from cursor position -> undefined bug)
		this.textarea.addEventListener('input', (e: Event) => {
			const target = e.target as HTMLTextAreaElement
			this.state.mutate({ input: target.value })
		})

		// update cursor position
		this.textarea.addEventListener('keydown', async () => {
			await new Promise((resolve) => setTimeout(resolve, 0)) // this is needed to prevent troika sync issues
			this.state.mutate({ cursorPos: this.textarea.selectionStart })
		})

		// listen for special keys
		this.textarea.addEventListener('keydown', (e) => {
			if (this.state.appState === State.idle) this.switchToInteraction()
			if (this.state.chatState !== InteractionState.input) {
				e.preventDefault()
				return
			}
			// This is seperate because preventDefault() doesn't work if the Promise is awaited
			switch (e.key) {
				case 'Enter':
					e.preventDefault()
					if (this.textarea.value.length === 0) {
						return
					}
					this.state.mutate({ specialKeyPressed: 'Enter' })
					this.textarea.value = ''
					break
				default:
					if (this.timer) {
						this.timer()
					}
					this.timer = startTimer(this.switchToIdle, config.idleTimeout)
					break
			}
		})
	}

	// State Control
	// Arrow functions to preserve 'this' context
	switchToInteraction = () => {
		this.state.mutate({
			appState: State.interaction,
			chatState: InteractionState.waiting,
		})
		startTimer(() => {
			this.state.mutate({
				chatState: InteractionState.input,
				message: this.state.greeting,
			})
		}, config.startDelay)
		this.timer = startTimer(this.switchToIdle, config.idleTimeout)
	}

	switchToIdle = () => {
		this.timer = null
		this.state.mutate({
			appState: State.idle,
			chatState: InteractionState.disabled,
			input: '',
			cursorPos: 0,
			messageID: 0,
			convoID: this.state.convoID + 1,
		})
		this.textarea.value = ''
	}

	// State Callbacks
	enterIdle = async () => {
		// prepare greeting for next interaction
		const trigger = {
			convoID: this.state.convoID,
			messageID: this.state.messageID,
			timestamp: getTimestamp(),
			type: ConvoType.input,
			text: '',
			trust: 0.0,
		}
		const greeting = await this.state.api.post('/api/infer', trigger)
		this.state.mutate({ greeting: greeting })
	}
}

customElements.define('input-el', HiddenInput)
