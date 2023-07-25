import axios, { AxiosInstance } from 'axios'
import { tryWithTimeout } from './misc'

export class API {
	api: AxiosInstance
	online: boolean
	constructor(baseURL: URL) {
		this.api = axios.create({
			baseURL: baseURL.origin,
			timeout: 1000,
			headers: {
				'Access-Control-Allow-Origin': 'self',
				'Content-Type': 'application/json',
			},
		})
	}

	async checkStatus(): Promise<void> {
		if (!this.api) throw new Error('Axios API not initialized')
		return tryWithTimeout(() => this.api.get('/status'), 60000).then(
			(response) => {
				if (response.status === 200) {
					this.online = true
				} else {
					this.online = false
					console.error(response.status)
				}
			}
		)
	}

	async get(url: string) {
		if (!this.api) throw new Error('Axios API not initialized')
		try {
			const response = await this.api.get(url)
			return response.data
		} catch (error) {
			console.error(error)
		}
	}

	async post(url: string, data: unknown) {
		if (!this.api) throw new Error('Axios API not initialized')
		try {
			const response = await this.api.post(url, data)
			return response.data
		} catch (error) {
			console.error(error)
		}
	}
}
