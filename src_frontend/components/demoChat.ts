import { Store } from '../state/store'
import config from '../front.config'
import { getTimestamp, startTimer } from '../utils/misc'
import { ConvoText, ConvoType, state } from '../utils/types'

export default class Chat extends HTMLElement {
	state: Store
	stopTimer: () => void

	conversationElement: HTMLElement
	messageInputElement: HTMLInputElement
	sendButtonElement: HTMLButtonElement

	constructor() {
		super()
		this.attachShadow({ mode: 'open' })

		const template = document.createElement('template')
		template.innerHTML = /*html*/ `
        <style scoped>
          :host * {
            color: white;
            font-family: sans-serif;
            font-size: 14px;
            padding: 5px;
          }

          #conversation::-webkit-scrollbar-track {
            background: none; /* Remove the background of the scrollbar track */
          }

          #conversation {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            overflow-y: scroll;
            gap: 10px;
            padding: 10px;
          }

          #container {
			background-color: black;
            display: flex;
            flex-direction: column;
            padding: 0px;
            margin: 0px;
            height: 100%;
            align-self: flex-end;
          }

          #input-row {
            display: flex;
            flex-direction: row;
            gap: 10px;
            background-color: #141414;
            border-radius: 5px 5px 0px 0px;
            padding: 10px;
          }
          
          input {
            flex-grow: 1;
            border-radius: 5px;
            border: none;
            background-color: #090909;
          }

          input:focus {
            outline: 1px solid blueviolet;
          }
          
          button {
            width: 100px;
            align-self: flex-end;
			background-color: blueviolet;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
        </style>
        <div id="container">
          <div id="conversation">
          </div>
          <div id="input-row">
            <input id="messageInput" type="text" placeholder="Type your message..." />
            <button id="sendButton">Send</button>
          </div>
        </div>
      `

		this.shadowRoot.appendChild(template.content.cloneNode(true))
		this.conversationElement = this.shadowRoot.getElementById('conversation')
		this.messageInputElement = this.shadowRoot.getElementById(
			'messageInput'
		) as HTMLInputElement

		this.sendButtonElement = this.shadowRoot.getElementById(
			'sendButton'
		) as HTMLButtonElement

		this.sendButtonElement.addEventListener('click', () => this.sendMessage())
		this.messageInputElement.addEventListener('keypress', (event) => {
			if (this.stopTimer) {
				this.stopTimer()
				this.stopTimer = null
			}
			if (this.state.appState === state.idle)
				this.state.mutate({ appState: state.interaction })
			if (event.key === 'Enter') {
				this.sendMessage()
			}
		})
	}

	initChat(globalState: Store) {
		this.state = globalState
	}

	sendMessage() {
		if (this.state.appState !== state.interaction) return // Don't send messages if the app is not idle
		const message = this.messageInputElement.value.trim() // Trim whitespace from the message
		if (message === '') {
			// Show visual feedback for empty message
			this.messageInputElement.blur() // Remove focus from the input element
			return // Exit the method if the message is empty
		}

		this.addMessage(message)
		this.messageInputElement.value = ''
		this.messageInputElement.style.border = 'none' // Reset border style
		this.response(message) // Call the response function to simulate a response
	}

	response(msg: string) {
		// Creates a reply message
		const data: ConvoText = {
			convoID: this.state.convoID,
			messageID: this.state.messageID,
			timestamp: getTimestamp(),
			type: ConvoType.input,
			text: msg,
		}
		this.state.mutate({ messageID: this.state.messageID + 1 })
		console.log(data)
		this.state.api.post('/api/infer', data).then((response: ConvoText) => {
			this.addMessage(response.text, '#1d1d1d', 'flex-end')
			if (!this.stopTimer)
				this.stopTimer = startTimer(() => {
					this.state.mutate({ appState: state.idle })
				}, config.idleTimeout)
			if (config.debugMsg) console.log(response)
		})
	}

	addMessage(message: string, color = 'blueviolet', align = 'flex-start') {
		const messageElement = document.createElement('div')
		messageElement.style.alignSelf = align
		messageElement.style.backgroundColor = color
		messageElement.style.borderRadius = '5px'
		messageElement.style.margin = '0px'
		messageElement.style.width = 'calc(100% - 120px)'
		messageElement.style.right = '0 px'
		messageElement.textContent = `${message}`
		this.conversationElement.appendChild(messageElement)
		this.scrollToBottom()
	}

	scrollToBottom() {
		this.conversationElement.scrollTop = this.conversationElement.scrollHeight
	}

	connectedCallback() {
		this.scrollToBottom()
	}
}

customElements.define('chat-el', Chat)
