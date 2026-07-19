import { CookieContainer, parseCookie, serializeCookie, usePluginLogger } from "castmate-core"
import { KasaCredentials, KasaDeviceConnection } from "../lan-api"
import { BaseKasaProtocol } from "../protocols/base-protocol"
import crypto, { createCipheriv, createDecipheriv, sign } from "node:crypto"
import https from "node:https"
import { mapKeys, mapRecord } from "castmate-schema"
import { Mutex } from "async-mutex"
import { BaseKasaTransport, KasaAuthProvider } from "./base-transport"
import { Readable, Writable } from "node:stream"
import { buffer } from "node:stream/consumers"
import assert from "node:assert"
import http from "node:http"
import { KasaAccount } from "../accounts/kasa-account"
//import { fetch } from "undici"

const logger = usePluginLogger("tplink-klap")

function md5(input: Buffer | string) {
	const result = crypto.createHash("md5").update(input).digest()
	assert(result.byteLength == 16)
	return result
}

function sha256(input: Buffer | string) {
	const result = crypto.createHash("sha256").update(input).digest()
	assert(result.byteLength == 32)
	return result
}

function sha1(input: Buffer | string) {
	const result = crypto.createHash("sha1").update(input).digest()
	assert(result.byteLength == 20)
	return result
}

function hashCredentials(credentials: KasaCredentials) {
	return md5(Buffer.concat([md5(credentials.username), md5(credentials.password)]))
}

function hashCredentials2(credentials: KasaCredentials) {
	return sha256(Buffer.concat([sha1(credentials.username), sha1(credentials.password)]))
}

function getKlapBaseAddress(device: KasaDeviceConnection) {
	return `${device.https ? "https" : "http"}://${device.address}:${device.port ?? (device.https ? 4433 : 80)}/app`
}

interface KlapConnection {
	device: KasaDeviceConnection
	cookies: CookieContainer
	httpsAgent: https.Agent
}

function hasHeaders(headers: Headers) {
	for (const key of headers) {
		return true
	}
	return false
}
/**
 * Manually set up http request not using fetch()
 * The internal http server rejects lowercase headers
 * fetch() and other http implementations don't let you control the casing of headers.
 * @param connection
 * @param url
 * @param body
 * @returns
 */
async function klapFetch(connection: KlapConnection, url: string, body?: Buffer) {
	const headers: Record<string, string> = {
		Accept: "*/*",
	}

	if (Object.keys(connection.cookies).length > 0) {
		headers["Cookie"] = serializeCookie(connection.cookies)
	}

	if (body != null) {
		headers["Content-Length"] = `${body.byteLength}`
		headers["Content-Type"] = "application/octet-stream"
	}

	// logger.log("KLAP FETCH 2", {
	// 	host: connection.device.address,
	// 	port: connection.device.port ?? 80,
	// 	path: `/app${url}`,
	// 	method: "POST",
	// 	headers,
	// })

	interface FakeFetchResp {
		body: Buffer
		response: http.IncomingMessage
	}

	const reqPromise = new Promise<FakeFetchResp>((resolve, reject) => {
		const req = http.request(
			{
				host: connection.device.address,
				port: connection.device.port ?? 80,
				path: `/app${url}`,
				method: "POST",
				headers,
			},
			(response) => {
				const chunks = new Array<Uint8Array>()

				response.on("data", (chunk) => {
					chunks.push(chunk)
				})

				response.once("error", (err) => {
					reject(err)
				})

				response.once("end", () => {
					if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
						return resolve({
							response,
							body: Buffer.concat(chunks),
						})
					}

					return reject({
						response,
						body: Buffer.concat(chunks),
					})
				})
			}
		)

		if (body != null) {
			req.write(body)
		}

		req.end()
	})

	const resp = await reqPromise

	// logger.log("KLAP RESP", resp.response.headers)
	// logger.log("   ", resp.body.toString("utf8"))

	const setCookie = resp.response.headers["set-cookie"]
	if (setCookie) {
		for (const cookie of setCookie) {
			const parsed = parseCookie(cookie)
			//logger.log("    FETCHED COOKIES", cookie, parsed)
			Object.assign(connection.cookies, parsed)
		}
	}

	return resp.body
}

interface KlapSession {
	sequence: number
	handshake: boolean
	readonly expired: boolean
	ensureHandshake(): Promise<void>
	encrypt(str: string): { encryptedData: Buffer; sequence: number }
	decrypt(buff: Buffer, sequence: number): string
}

const KLAP_SESSION_COOKIE_NAME = "TP_SESSIONID"
const KLAP_TIMEOUT_COOKIE_NAME = "TIMEOUT"

const kasaDefaultCredentials: Record<string, KasaCredentials> = {
	KASA: { username: "kasa@tp-link.net", password: "kasaSetup" },
}

interface KlapHandshake1Result {
	localSeed: Buffer
	remoteSeed: Buffer
	authHash: Buffer
	protocol: "v1" | "v2"
}

function klapHandshake1AuthHashV1(localSeed: Buffer, authHash: Buffer) {
	return sha256(Buffer.concat([localSeed, authHash]))
}

function klapHandshake1AuthHashV2(localSeed: Buffer, remoteSeed: Buffer, authHash: Buffer) {
	return sha256(Buffer.concat([localSeed, remoteSeed, authHash]))
}

function klapHandshake2AuthHashV1(remoteSeed: Buffer, authHash: Buffer) {
	return sha256(Buffer.concat([remoteSeed, authHash]))
}

function klapHandshake2AuthHashV2(localSeed: Buffer, remoteSeed: Buffer, authHash: Buffer) {
	return sha256(Buffer.concat([remoteSeed, localSeed, authHash]))
}

function tryKlapHandshake1(
	localSeed: Buffer,
	remoteSeed: Buffer,
	serverHash: Buffer,
	creds: KasaCredentials
): KlapHandshake1Result | undefined {
	const authHashV1 = hashCredentials(creds)
	const authHashV2 = hashCredentials2(creds)
	const localSeedHashV1V1 = klapHandshake1AuthHashV1(localSeed, authHashV1)
	const localSeedHashV1V2 = klapHandshake1AuthHashV1(localSeed, authHashV2)
	const localSeedHashV2V1 = klapHandshake1AuthHashV2(localSeed, remoteSeed, authHashV1)
	const localSeedHashV2V2 = klapHandshake1AuthHashV2(localSeed, remoteSeed, authHashV2)

	// logger.log("=====KASA CREDS", creds.username, "=====")
	// logger.log("    ", "H1", authHashV1.toString("hex"))
	// logger.log("    ", "H2", authHashV2.toString("hex"))
	// logger.log("    ", "S1H1", localSeedHashV1V1.toString("hex"))
	// logger.log("    ", "S1H2", localSeedHashV1V2.toString("hex"))
	// logger.log("    ", "S2H2", localSeedHashV2V2.toString("hex"))
	// logger.log("    ", "S2H1", localSeedHashV2V1.toString("hex"))
	// logger.log("    ", "Serv", serverHash.toString("hex"))

	if (localSeedHashV1V1.compare(serverHash) == 0) {
		return {
			localSeed,
			remoteSeed,
			authHash: authHashV1,
			protocol: "v1",
		}
	}

	if (localSeedHashV1V2.compare(serverHash) == 0) {
		return {
			localSeed,
			remoteSeed,
			authHash: authHashV2,
			protocol: "v1",
		}
	}

	if (localSeedHashV2V2.compare(serverHash) == 0) {
		return {
			localSeed,
			remoteSeed,
			authHash: authHashV2,
			protocol: "v2",
		}
	}

	if (localSeedHashV2V1.compare(serverHash) == 0) {
		return {
			localSeed,
			remoteSeed,
			authHash: authHashV1,
			protocol: "v2",
		}
	}

	return undefined
}

async function klapHandshake1(session: KlapSessionInternal, connection: KlapConnection): Promise<KlapHandshake1Result> {
	const localSeed = crypto.randomBytes(16)
	assert(localSeed.byteLength == 16)

	const respdata = await klapFetch(connection, "/handshake1", localSeed)

	//logger.log("Handshake1 Resp Data", respdata.byteLength, respdata.toString("hex"))

	const remoteSeed = respdata.subarray(0, 16)
	const serverHash = respdata.subarray(16, 48)
	assert(serverHash.byteLength == 32)
	assert(remoteSeed.byteLength == 16)

	const localResult = tryKlapHandshake1(localSeed, remoteSeed, serverHash, session.authProvider())
	if (localResult) {
		return localResult
	}

	for (const [key, creds] of Object.entries(kasaDefaultCredentials)) {
		const defaultResult = tryKlapHandshake1(localSeed, remoteSeed, serverHash, creds)
		if (defaultResult) {
			return defaultResult
		}
	}

	const blankResult = tryKlapHandshake1(localSeed, remoteSeed, serverHash, { username: "", password: "" })
	if (blankResult) {
		return blankResult
	}

	throw new Error("Unable to find creds for handshake")
}

function numberToBuffer(num: number): Buffer {
	const result = Buffer.alloc(4)
	result.writeInt32BE(num)
	return result
}

function createKlapEncryptionSig(shake: KlapHandshake1Result) {
	const buff = Buffer.concat([Buffer.from("ldk"), shake.localSeed, shake.remoteSeed, shake.authHash])
	const hash = sha256(buff)
	return hash.subarray(0, 28)
}

function createKlapEncryptionKey(shake: KlapHandshake1Result) {
	const buff = Buffer.concat([Buffer.from("lsk"), shake.localSeed, shake.remoteSeed, shake.authHash])
	const hash = sha256(buff)
	return hash.subarray(0, 16)
}

function createKlapEncryptionIV(shake: KlapHandshake1Result) {
	const buff = Buffer.concat([Buffer.from("iv"), shake.localSeed, shake.remoteSeed, shake.authHash])
	const hash = sha256(buff)
	const seq = hash.readInt32BE(hash.length - 4)
	return {
		iv: hash.subarray(0, 12),
		seq,
	}
}

interface KlapEncryptionBuffers {
	sig: Buffer
	key: Buffer
	iv: Buffer
}

function createKlapEncryptionBuffers(shake: KlapHandshake1Result): [KlapEncryptionBuffers, number] {
	const ivdata = createKlapEncryptionIV(shake)
	return [
		{
			sig: createKlapEncryptionSig(shake),
			key: createKlapEncryptionKey(shake),
			iv: ivdata.iv,
		},
		ivdata.seq,
	]
}

function createKlapCipher(buffers: KlapEncryptionBuffers, sequence: number) {
	return createCipheriv("aes-128-cbc", buffers.key, Buffer.concat([buffers.iv, numberToBuffer(sequence)]))
}

function createKlapDecipher(buffers: KlapEncryptionBuffers, sequence: number) {
	return createDecipheriv("aes-128-cbc", buffers.key, Buffer.concat([buffers.iv, numberToBuffer(sequence)]))
}

async function klapHandshake2(
	session: KlapSession,
	connection: KlapConnection,
	handshake1Result: KlapHandshake1Result
) {
	let payloadHash: Buffer
	if (handshake1Result.protocol == "v1") {
		payloadHash = klapHandshake2AuthHashV1(handshake1Result.remoteSeed, handshake1Result.authHash)
	} else {
		payloadHash = klapHandshake2AuthHashV2(
			handshake1Result.localSeed,
			handshake1Result.remoteSeed,
			handshake1Result.authHash
		)
	}

	return await klapFetch(connection, "/handshake2", payloadHash)
}

interface KlapSessionInternal extends KlapSession {
	expiration?: number
	handshakeLock: Mutex
	encryptionBuffers?: KlapEncryptionBuffers
	authProvider: KasaAuthProvider
}

function createKlapSession(connection: KlapConnection, authProvider: KasaAuthProvider): KlapSession {
	const session: KlapSessionInternal = {
		sequence: 0,
		handshake: false,
		handshakeLock: new Mutex(),
		authProvider,
		async ensureHandshake() {
			if (this.handshake) return //Don't lock mutex if we have handshake

			await this.handshakeLock.runExclusive(async () => {
				if (this.handshake) return //Double check we didn't init while waiting on the mutex

				connection.cookies = {}

				//logger.log("Doing Handshake")

				const shake = await klapHandshake1(this, connection)

				//logger.log("Shook", shake)

				const sessionCookie = connection.cookies[KLAP_SESSION_COOKIE_NAME]

				const sessionTimeoutCookie = connection.cookies[KLAP_TIMEOUT_COOKIE_NAME]

				const timeout = sessionTimeoutCookie ? Number.parseInt(sessionTimeoutCookie) : 24 * 60 * 60

				//logger.log("Session", sessionCookie, "Timeout", timeout)

				if (sessionCookie) {
					connection.cookies = {
						[KLAP_SESSION_COOKIE_NAME]: sessionCookie,
					}
				}

				this.expiration = Date.now() + timeout * 1000 - 60 * 1000 // subtract some buffer

				await klapHandshake2(this, connection, shake)

				//logger.log("Shook2")

				const [buffers, initialSeq] = createKlapEncryptionBuffers(shake)
				this.encryptionBuffers = buffers
				this.sequence = initialSeq

				this.handshake = true
			})
		},
		get expired() {
			return this.expiration == null || Date.now() > this.expiration
		},
		encrypt(str) {
			if (!this.encryptionBuffers) throw new Error("Not Authed")

			this.sequence++
			const seqBuffer = numberToBuffer(this.sequence)

			const cipher = createKlapCipher(this.encryptionBuffers, this.sequence)

			const cipherText = Buffer.concat([cipher.update(str), cipher.final()])
			const signature = sha256(Buffer.concat([this.encryptionBuffers.sig, seqBuffer, cipherText]))

			return {
				encryptedData: Buffer.concat([signature, cipherText]),
				sequence: this.sequence,
			}
		},
		decrypt(buff, seq) {
			if (!this.encryptionBuffers) throw new Error("Not Authed")

			const decipher = createKlapDecipher(this.encryptionBuffers, seq)

			const textData = Buffer.concat([decipher.update(buff.subarray(32)), decipher.final()])

			const text = textData.toString()

			return text
		},
	}

	return session
}

export function createKlapTransport(device: KasaDeviceConnection, credentials?: KasaCredentials): BaseKasaTransport {
	const connection: KlapConnection = {
		device,
		httpsAgent: new https.Agent({
			rejectUnauthorized: false,
		}),
		cookies: {},
	}

	const session = createKlapSession(connection, () => {
		return {
			username: KasaAccount.main.config.email ?? "",
			password: KasaAccount.main.secrets.password ?? "",
		}
	})

	return {
		get defaultPort() {
			return 80
		},
		getCredentialsHash() {},
		async close() {},
		async reset() {},
		async send(request) {
			await session.ensureHandshake()

			const encData = session.encrypt(request)

			const resp = await klapFetch(connection, `/request?seq=${session.sequence}`, encData.encryptedData)

			const dec = session.decrypt(resp, encData.sequence)

			return JSON.parse(dec)
		},
	}
}
