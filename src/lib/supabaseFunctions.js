export async function parseFunctionError(error, fallbackMessage) {
  if (!error) {
    return { message: fallbackMessage || 'Unexpected function error.', payload: null, status: 500 }
  }

  const fallback = error.message || fallbackMessage || 'Unexpected function error.'

  if (error.context && typeof error.context.json === 'function') {
    try {
      const payload = await error.context.json()
      return {
        message: payload?.error || fallback,
        payload,
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

  return { message: fallback, payload: null, status: 500 }
}
