// src/api/client.ts
import axios, { AxiosError, AxiosResponse } from 'axios';

// src/api/client.ts
//
// 1) Map of low‑level error codes → human messages
//
const codeMessages: Record<string,string> = {
  // Node.js system errors
  ECONNREFUSED:    'Connection refused (is the server or proxy running?)',
  ENOTFOUND:       'Domain not found (DNS lookup failed)',
  EAI_AGAIN:       'DNS lookup timed out',
  ECONNABORTED:    'Connection aborted (timeout or cancelled)',
  ETIMEDOUT:       'Connection timed out',
  ECONNRESET:      'Connection reset by peer',
  EHOSTUNREACH:    'No route to host (host unreachable)',
  EPIPE:           'Broken pipe (connection closed by remote)',
  EADDRINUSE:      'Local address already in use',
  EADDRNOTAVAIL:   'Local address not available',
  ENETDOWN:        'Network is down',
  ENETUNREACH:     'Network is unreachable',
  ENETRESET:       'Network dropped connection',
  ENOBUFS:         'No buffer space available',
  ENOTCONN:        'Socket not connected',
  EACCES:          'Permission denied',
  EPERM:           'Operation not permitted',
  EPARSE:          'Malformed response (parse error)',

  // Axios‑specific / HTTP client errors
  ERR_BAD_OPTION:                'Invalid request option',
  ERR_BAD_OPTION_VALUE:          'Invalid value for request option',
  ERR_BAD_RESPONSE:              'Received bad response from server',
  ERR_FR_TOO_MANY_REDIRECTS:     'Too many redirects',
  ERR_DEPRECATED:                'Deprecated API usage',
  ERR_INVALID_URL:               'Invalid URL',
  ERR_CANCELED:                  'Request was canceled',
  ERR_HTTP2_STREAM_CANCEL:       'HTTP/2 stream was canceled',
  ERR_OSSL_EVP_UNSUPPORTED:      'SSL algorithm not supported',
  ERR_TLS_CERT_ALTNAME_INVALID:  'SSL cert “alt name” mismatch',
  ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED:
                                 'SSL cert signature algorithm unsupported',
  ERR_TLS_DH_PARAM_SIZE:         'SSL DH parameter size too small',
  ERR_TLS_HANDSHAKE_TIMEOUT:     'SSL handshake timed out',
  ERR_TLS_RENEGOTIATION_DISABLED:'SSL renegotiation disabled on server',
};

//
// 2) Create your Axios instance _without_ baseURL
//
const api = axios.create({
  timeout: 5_000,
  // no baseURL here; you’ll supply it later
});

//
// 3) Friendly‑error interceptor
//
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError): Promise<never> => {
    if (!axios.isAxiosError(err)) {
      return Promise.reject(err);
    }

    const { config, code, request, response, message: origMsg } = err;
    const method = (config?.method || 'request').toUpperCase();
    const url    = config?.url    || '<unknown url>';
    let friendly = `[${method} ${url}] failed: `;

    if (response) {
      // HTTP error (4xx/5xx)
      friendly += `Server replied ${response.status}`;
      if (response.data != null) {
        const preview = typeof response.data === 'string'
          ? response.data.slice(0, 200)
          : JSON.stringify(response.data).slice(0, 200);
        friendly += ` - ${preview}`;
      }
    }
    else if (request) {
      // No response (network/socket error)
      friendly += (code && codeMessages[code]) ? codeMessages[code] : origMsg;
    }
    else {
      // Something wrong in setup
      friendly += `Request setup failed: ${origMsg}`;
    }

    const e = new Error(friendly);
    // @ts-ignore
    e.cause = err;
    return Promise.reject(e);
  }
);

export default api;
