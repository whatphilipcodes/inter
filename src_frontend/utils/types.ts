enum state {
	loading = 'loading',
	idle = 'idle',
	interaction = 'interaction',
	error = 'error',
	exit = 'exit',
}

// See utils.py for pydantic counterpart
enum ConvoType {
	input = 'input',
	response = 'response',
}

enum backendState {
	loading = 'loading',
	training = 'training',
	inference = 'inference',
	error = 'error',
	exit = 'exit',
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

type LoopPatch = {
	state: backendState
}

// export
export { state, backendState, ConvoType, ConvoText, LoopPatch }
