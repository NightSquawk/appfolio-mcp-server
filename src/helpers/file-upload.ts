import { open, stat } from "node:fs/promises";
import { basename, extname, isAbsolute } from "node:path";

/**
 * Shared local-file upload support for the multipart/form-data Database API
 * endpoints (every POST .../attachments and .../photos operation).
 *
 * The file is validated and read fully into memory BEFORE any request is made,
 * so a bad path never reaches AppFolio and no file handle outlives this module:
 * the handle is closed in a finally block, and the in-memory bytes can be re-sent
 * verbatim if AppFolio answers 429. File contents are never logged or echoed.
 */

/** What the caller asks to upload (call_endpoint's `file` argument). */
export interface FileUploadInput {
  /** Absolute path to a local file. */
  path: string;
  /** Filename sent to AppFolio. Defaults to the path's basename. */
  filename?: string;
  /** MIME type. Defaults to a guess from the file extension. */
  content_type?: string;
}

/** A validated file, read into memory and ready to send. */
export interface PreparedUpload {
  filename: string;
  contentType: string;
  bytes: Uint8Array<ArrayBuffer>;
}

/** Thrown for any problem found before the request is sent. */
export class FileUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileUploadError";
  }
}

/** Upper bound on a single upload, checked from stat() before the file is read. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpe": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".rtf": "application/rtf",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".eml": "message/rfc822",
  ".msg": "application/vnd.ms-outlook",
  ".zip": "application/zip",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

/** MIME type for a filename by extension; application/octet-stream if unknown. */
export function guessContentType(filename: string): string {
  return MIME_BY_EXTENSION[extname(filename).toLowerCase()] ?? "application/octet-stream";
}

// type/subtype with optional parameters; no CR/LF (header injection).
const CONTENT_TYPE_RE = /^[\w.+-]+\/[\w.+-]+(\s*;\s*[\w.+-]+=("[^"\r\n]*"|[\w.+-]+))*$/;
// eslint-disable-next-line no-control-regex
const UNSAFE_FILENAME_RE = /[\\/\x00-\x1f\x7f]/;

/**
 * Validate a local file (absolute path, exists, regular file, readable,
 * non-empty, under MAX_UPLOAD_BYTES) and read it into memory. Throws
 * FileUploadError with a caller-facing message; never includes file contents.
 */
export async function prepareUpload(input: FileUploadInput): Promise<PreparedUpload> {
  const path = typeof input?.path === "string" ? input.path.trim() : "";
  if (!path) {
    throw new FileUploadError('file.path is required: the absolute path of the local file to upload.');
  }
  // The MCP server's working directory is wherever the client launched it, so a
  // relative path would resolve somewhere unpredictable.
  if (!isAbsolute(path)) {
    throw new FileUploadError(`file.path must be an absolute path (got "${path}").`);
  }

  let info;
  try {
    info = await stat(path);
  } catch (error: any) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") {
      throw new FileUploadError(`File not found: "${path}".`);
    }
    if (error?.code === "EACCES" || error?.code === "EPERM") {
      throw new FileUploadError(`File is not accessible (permission denied): "${path}".`);
    }
    throw new FileUploadError(`Cannot access file "${path}": ${error?.code ?? error?.message ?? "unknown error"}.`);
  }
  if (!info.isFile()) {
    throw new FileUploadError(`Not a regular file: "${path}" (directories, devices and pipes cannot be uploaded).`);
  }
  if (info.size === 0) {
    throw new FileUploadError(`File is empty: "${path}".`);
  }
  if (info.size > MAX_UPLOAD_BYTES) {
    throw new FileUploadError(
      `File is too large: "${path}" is ${info.size} bytes; the limit is ${MAX_UPLOAD_BYTES} bytes.`
    );
  }

  const filename = input.filename !== undefined ? input.filename.trim() : basename(path);
  if (!filename || UNSAFE_FILENAME_RE.test(filename)) {
    throw new FileUploadError(
      `Invalid file.filename "${input.filename}": must be a bare filename without path separators or control characters.`
    );
  }

  const contentType = input.content_type !== undefined ? input.content_type.trim() : guessContentType(filename);
  if (!CONTENT_TYPE_RE.test(contentType)) {
    throw new FileUploadError(`Invalid file.content_type "${input.content_type}": expected a MIME type such as "image/jpeg".`);
  }

  let handle;
  try {
    handle = await open(path, "r");
  } catch (error: any) {
    throw new FileUploadError(`File is not readable: "${path}" (${error?.code ?? "open failed"}).`);
  }
  try {
    const bytes = new Uint8Array(await handle.readFile());
    if (bytes.byteLength === 0) {
      throw new FileUploadError(`File is empty: "${path}".`);
    }
    return { filename, contentType, bytes };
  } catch (error: any) {
    if (error instanceof FileUploadError) throw error;
    throw new FileUploadError(`Failed to read file "${path}" (${error?.code ?? "read failed"}).`);
  } finally {
    await handle.close();
  }
}

/**
 * Build the multipart body: the file under `fileField` (with filename + MIME
 * type) plus any extra scalar form fields (e.g. Position for marketing photos).
 * The caller must NOT set Content-Type; fetch generates it with the boundary.
 */
export function buildMultipartBody(
  upload: PreparedUpload,
  fileField: string,
  fields?: Record<string, unknown>
): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (value === undefined || value === null) continue;
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
      throw new FileUploadError(
        `Multipart form field "${key}" must be a string, number or boolean (got ${Array.isArray(value) ? "array" : typeof value}).`
      );
    }
    form.append(key, String(value));
  }
  form.append(fileField, new Blob([upload.bytes], { type: upload.contentType }), upload.filename);
  return form;
}
