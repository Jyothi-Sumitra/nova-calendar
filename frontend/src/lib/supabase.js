import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
)

// Attach the signed-in user's Supabase access token to NOVA API requests.
// This keeps the existing calendar components unchanged while ensuring
// FastAPI can identify which user's events are being requested.
if (typeof window !== 'undefined' && !window.__novaAuthFetchInstalled) {
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url

    if (!url.includes('/api/')) {
      return originalFetch(input, init)
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const headers = new Headers(
      init.headers ||
        (typeof Request !== 'undefined' && input instanceof Request
          ? input.headers
          : undefined)
    )

    if (session?.access_token) {
      headers.set(
        'Authorization',
        `Bearer ${session.access_token}`
      )
    }

    return originalFetch(input, {
      ...init,
      headers,
    })
  }

  window.__novaAuthFetchInstalled = true
}
