/**
 * Tries an asynchronous operation repeatedly until it succeeds or the maximum duration is reached.
 * @template T The type of the resolved value from the Promise.
 * @param {() => Promise<T>} operation The asynchronous operation to be tried.
 * @param {number} maxDurationMs The maximum duration in milliseconds to keep trying the operation.
 * @param {number} intervallMs (optional) The time interval in milliseconds between retries. Default is 1000ms (1 second).
 * @returns {Promise<T>} A Promise that resolves with the result of the successful operation or rejects with the last error encountered.
 */
function tryWithTimeout<T>(
	operation: () => Promise<T>,
	maxDurationMs: number,
	intervallMs = 1000
): Promise<T> {
	return new Promise((resolve, reject) => {
		const startTime = Date.now()

		function tryOperation() {
			operation()
				.then(resolve)
				.catch((error) => {
					const currentTime = Date.now()
					const elapsedTime = currentTime - startTime

					if (elapsedTime < maxDurationMs) {
						// Retry if there's time remaining
						setTimeout(tryOperation, intervallMs) // Retry after 1 second
					} else {
						reject(error) // Max duration reached, reject with the last error
					}
				})
		}

		tryOperation()
	})
}

/**
 * Returns the current timestamp in the format 'YYYY-MM-DD_HH:mm:ss:SSS'.
 * The timestamp includes the year, month, day, hour, minute, second, and milliseconds.
 *
 * @returns {string} The formatted timestamp as a string.
 */
function getTimestamp(): string {
	// Get the current date and time
	const date = new Date()

	// Extract individual components of the timestamp
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')
	const seconds = String(date.getSeconds()).padStart(2, '0')
	const milliseconds = String(date.getMilliseconds()).padStart(6, '0')

	// Combine the components to form the formatted timestamp
	return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}:${milliseconds}`
}

export { tryWithTimeout, getTimestamp }
