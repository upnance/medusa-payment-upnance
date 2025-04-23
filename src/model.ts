import { createHmac } from 'crypto'
import { PayInStatus } from './__generated__/upnance'

export const UPNANCE_IDENTIFIER = 'upnance'

export const API_PRODUCTION_URL = 'https://api.upnance.com/'
export const API_STAGING_URL = 'https://api.staging.upnance.com/'

export const WEBHOOK_HEADER_CHECKSUM_NAME = 'upnance-checksum-sha256'

export interface UpnanceOptions {
	accountId: string
	apiKey: string;
	apiKeySecret: string;
	environment: "staging" | "production"
	/**
	 * Use this flag to capture payment immediately (default is false)
	 */
	autoCapture?: boolean;
}

export const isChecksumValid = (value: Record<string, unknown>, checksum: string, secret: string): boolean => {
  try {
    const hashedBody = createHmac('sha256', secret).update(JSON.stringify(value)).digest('hex')

    return checksum === hashedBody
  } catch {
    return false
  }
}

export type WebhookPayload = {
  id: string,
  status: PayInStatus
}