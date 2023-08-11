enum State {
	loading = 'loading',
	idle = 'idle',
	interaction = 'interaction',
	error = 'error',
	exit = 'exit',
}

enum Sender {
	user = 'user',
	agent = 'agent',
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
	tokens?: string[]
}

type LoopPatch = {
	state: BackendState
}

// export
export { State, Sender, BackendState, ConvoType, ConvoText, LoopPatch }
