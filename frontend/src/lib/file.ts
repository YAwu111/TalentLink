export type UploadCategory = 'intro' | 'identity'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const INTRO_EXTENSIONS = new Set(['pdf', 'docx', 'png', 'jpg', 'jpeg'])
const IDENTITY_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg'])

const FORMAT_LABELS: Record<UploadCategory, string> = {
  intro: 'PDF、DOCX、PNG、JPG',
  identity: 'PDF、PNG、JPG',
}

export const CATEGORY_ACCEPT: Record<UploadCategory, string> = {
  intro: '.pdf,.docx,.png,.jpg,.jpeg',
  identity: '.pdf,.png,.jpg,.jpeg',
}

export function categoryFormatLabel(category: UploadCategory): string {
  return FORMAT_LABELS[category]
}

export function fileExtension(name: string): string {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index + 1).toLowerCase() : ''
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function validateUploadFile(
  file: File,
  category: UploadCategory,
): string | null {
  if (file.size === 0) return '文件为空，请重新选择'
  if (file.size > MAX_UPLOAD_BYTES) return '文件不能超过 10MB'

  const allowed =
    category === 'intro' ? INTRO_EXTENSIONS : IDENTITY_EXTENSIONS
  const extension = fileExtension(file.name)
  if (extension) {
    if (!allowed.has(extension)) {
      return `仅支持 ${FORMAT_LABELS[category]}`
    }
    return null
  }

  if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
    return null
  }
  return `仅支持 ${FORMAT_LABELS[category]}`
}
