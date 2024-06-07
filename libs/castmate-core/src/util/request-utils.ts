import axios from "axios"

/**
 * Axios instance that has a timeout so if a network request is taking ages we don't hold up booting
 */
export const coreAxios = axios.create({
	timeout: 2000,
})
