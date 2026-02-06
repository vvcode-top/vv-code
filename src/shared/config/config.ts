/**
 * Configuration endpoints and settings
 */

import { normalizeVvBackendBaseUrl } from "@/shared/vv-config"

/**
 * API base URL (不含 /api 后缀)
 * 通过 VV_API_BASE_URL 环境变量配置，未设置则使用线上地址。
 * 兼容：VV_API_BASE_URL 也可传入带 /api 的旧格式。
 */
export const API_BASE_URL = normalizeVvBackendBaseUrl(process.env.VV_API_BASE_URL)

/**
 * Configuration API endpoint
 */
export const CONFIG_ENDPOINT = `${API_BASE_URL}/api`

/**
 * Configuration fetch timeout (in milliseconds)
 */
export const CONFIG_FETCH_TIMEOUT = 5000
