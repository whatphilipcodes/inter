import { State, InteractionState } from './utils/types'
const config = {
	// app settings
	loadingScreen: true,
	botStarts: true,
	startDelay: 2000,
	historyInterval: 1500,
	numBufferMsg: 50,
	numLoadedMsg: 30,
	truthScore: true,
	devUI: false,
	devTools: true,
	fullScreen: false,
	hideCursor: false,
	debugMsg: false,
	showHiddenInput: false,
	idleTimeout: 50000,

	// api settings
	apiTimeout: 120000,

	// textarea settings
	maxInputLength: 128,

	// initial state
	initState: {
		// state
		appState: State.loading,
		chatState: InteractionState.disabled,

		// textarea
		input: '',
		cursorPos: 0,
		maxInputLength: 128,

		// api
		convoID: 0,
		messageID: 0,

		// grid settings
		padding: 0.1,
		numLines: 18,
		numLinesSpacing: 1,

		// message settings
		ctpOffsetRatio: 0.34,
		msgWidthRatio: 0.66,

		// text settings
		fontLineHeightRatio: 1.2,
		cursorWidthRatio: 0.1,
		sdfGlyphSize: 64,
	},
}

export default config
