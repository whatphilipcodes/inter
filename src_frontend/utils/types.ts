enum appState {
	loading = 'loading',
	idle = 'idle',
	interaction = 'interaction',
	error = 'error',
}

// See utils.py for pydantic counterpart
enum ConvoType {
	INPUT = 0,
	RESPONSE = 1,
}

// See utils.py for pydantic counterpart
type ConvoText = {
	convoID: number
	messageID: number
	timestamp: string
	type: ConvoType
	text: string
	tokens?: string[]
}

// export
export { appState, ConvoType, ConvoText }
