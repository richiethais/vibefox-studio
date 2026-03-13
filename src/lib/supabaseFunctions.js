export async function parseFunctionError(error, fallbackMessage) {
  if (!error) {
    return { message: fallbackMessage || 'Unexpected function error.', payload: null, status: 500 }
  }

  const fallback = error.message || fallbackMessage || 'Unexpected function error.'
  const context = error.context

  if (!context) {
    return { message: fallback, payload: null, status: 500 }
  }

  // Context is a Response object — read as text first to avoid body-stream consumption bug
  // (.json() consumes the stream; if it fails, .text() also fails)
  if (typeof context.text === 'function') {
    try {
      const rawText = await context.text()
      try {
        const payload = JSON.parse(rawText)
        const stage = payload?.stage ? ` (stage: ${payload.stage})` : ''
        return {
          message: payload?.error ? `${payload.error}${stage}` : (rawText.trim() || fallback),
          payload,
          status: context.status || 500,
        }
      } catch {
        return {
          message: rawText.trim() || fallback,
          payload: null,
          status: context.status || 500,
        }
      }
    } catch {
      return { message: fallback, payload: null, status: context.status || 500 }
    }
  }

  // Context is already a parsed plain object (some Supabase versions)
  if (typeof context === 'object') {
    const stage = context.stage ? ` (stage: ${context.stage})` : ''
    return {
      message: context.error ? `${context.error}${stage}` : fallback,
      payload: context,
      status: 500,
    }
  }

  return { message: fallback, payload: null, status: 500 }
}
