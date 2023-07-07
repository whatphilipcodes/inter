class Chat extends HTMLElement {
    conversationElement: HTMLElement;
    messageInputElement: HTMLInputElement;
    sendButtonElement: HTMLButtonElement;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = /*html*/ `
        <style>
          :host {
            display: flex;
            flex-direction: column;
          }
          
          div {
            color: white;
            background-color: #333;
            padding: 10px;
            margin: 5px;
            border-radius: 5px;
          }
          
          input {
            margin-top: 10px;
            padding: 5px;
          }
          
          button {
            margin-top: 5px;
            padding: 5px 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
        </style>
        <div id="conversation">
        </div>
        <input id="messageInput" type="text" placeholder="Type your message..." />
        <button id="sendButton">Send</button>
      `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.conversationElement = this.shadowRoot.getElementById('conversation');
        this.messageInputElement = this.shadowRoot.getElementById('messageInput') as HTMLInputElement;
        this.sendButtonElement = this.shadowRoot.getElementById('sendButton') as HTMLButtonElement;

        this.sendButtonElement.addEventListener('click', () => this.sendMessage());
        this.messageInputElement.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    sendMessage() {
        const message = this.messageInputElement.value;
        this.addMessage('You', message);
        this.messageInputElement.value = '';
        this.response(); // Call the response function to simulate a response
    }

    response() {
        // Simulate a response by adding a message from the bot
        const botMessage = 'This is a response from the bot.';
        setTimeout(() => {
            this.addMessage('Bot', botMessage);
        }, 1000);
    }

    addMessage(sender: string, message: string) {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${sender}: ${message}`;
        this.conversationElement.appendChild(messageElement);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.conversationElement.scrollTop = this.conversationElement.scrollHeight;
    }

    connectedCallback() {
        this.scrollToBottom();
    }
}

customElements.define('chat-el', Chat);
