import { State } from './utils/types'
const config = {
	// app settings
	devUI: true,
	devTools: true,
	fullScreen: true,
	hideCursor: false,
	debugMsg: true,
	showHiddenInput: true,
	apiTimeout: 120000,
	idleTimeout: 20000,

	// textarea settings
	maxInputLength: 128,

	// initial state
	initState: {
		// state
		appState: State.loading,

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
