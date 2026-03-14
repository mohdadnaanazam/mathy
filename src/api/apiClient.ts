const getBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_URL_LOCAL ??
    'http://localhost:4000'
  return url.replace(/\/+$/, '') // no trailing slash
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBaseUrl()
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${pathNorm}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API error ${res.status}: ${text || res.statusText}`)
  }

  return res.json() as Promise<T>
}

export const apiClient = {
  get: request,
}

export const API_BASE_URL = getBaseUrl()

