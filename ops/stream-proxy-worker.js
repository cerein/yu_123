export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname !== '/stream') {
      return new Response('not found', { status: 404 })
    }
    const target = url.searchParams.get('url') || ''
    if (!/^http:\/\//i.test(target)) {
      return new Response('invalid url', { status: 400 })
    }
    const headers = new Headers()
    const range = request.headers.get('range')
    if (range) headers.set('range', range)
    const upstream = await fetch(target, { headers })
    const responseHeaders = new Headers(upstream.headers)
    responseHeaders.set('access-control-allow-origin', '*')
    responseHeaders.set('access-control-expose-headers', 'content-length,content-range,accept-ranges,content-type')
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders
    })
  }
}
