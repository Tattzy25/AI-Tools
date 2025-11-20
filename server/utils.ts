export function toDataUrl(mime: string, buf: Buffer) {
  return `data:${mime};base64,${buf.toString('base64')}`
}

export function isSupportedMime(mime: string) {
  const isImage = !!mime && mime.startsWith('image/')
  const isText = mime === 'text/plain'
  const isJson = mime === 'application/json' || mime === 'application/ld+json'
  const isCsv = mime === 'text/csv' || mime === 'application/vnd.ms-excel'
  const isXml = mime === 'application/xml' || mime === 'text/xml'
  return { isImage, isText, isJson, isCsv, isXml }
}