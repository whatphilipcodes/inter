enum State {
	loading = 'loading',
	idle = 'idle',
	interaction = 'interaction',
	error = 'error',
	exit = 'exit',
}

enum InteractionState {
	input = 'input',
	waiting = 'waiting',
	disabled = 'disabled',
}

// See utils.py for pydantic counterpart
enum ConvoType {
	input = 'input',
	response = 'response',
}

enum BackendState {
	loading = 'loading',
	training = 'training',
	inference = 'inference',
	error = 'error',
	exit = 'exit',
}

// See utils.py for pydantic counterparts
type ConvoText = {
	convoID: number
	messageID: number
	timestamp: string
	type: ConvoType
	text: string
	trust: number
	tokens?: string[]
}

type LoopPatch = {
	state: BackendState
}

// export
export {
	State,
	InteractionState,
	BackendState,
	ConvoType,
	ConvoText,
	LoopPatch,
}
