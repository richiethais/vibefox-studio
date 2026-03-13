export async function parseFunctionError(error, fallbackMessage) {
  if (!error) {
    return { message: fallbackMessage || 'Unexpected function error.', payload: null, status: 500 }
  }

  const fallback = error.message || fallbackMessage || 'Unexpected function error.'

  if (error.context && typeof error.context.json === 'function') {
    try {
      const payload = await error.context.json()
      const stage = payload?.stage ? ` (stage: ${payload.stage})` : ''
      return {
        message: payload?.error ? `${payload.error}${stage}` : fallback,
        payload,
        status: error.context.status || 500,
      }
    } catch {
      if (typeof error.context.text === 'function') {
        try {
          const rawText = (await error.context.text()).trim()
          return {
            message: rawText || fallback,
            payload: null,
            status: error.context.status || 500,
          }
        } catch {
          return {
            message: fallback,
            payload: null,
            status: error.context.status || 500,
          }
        }
      }

      return {
        message: fallback,
        payload: null,
        status: error.context.status || 500,
      }
    }
  }

  return { message: fallback, payload: null, status: 500 }
}
