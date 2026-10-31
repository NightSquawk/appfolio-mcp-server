// Multipart file-upload tests for call_endpoint. Runs against the compiled dist/
// (npm test builds first). fetch is mocked: no request ever leaves the process.
// Each captured request is re-serialized through a real Request so the
// assertions see the exact multipart bytes and Content-Type fetch would send.
import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.APPFOLIO_DB_CLIENT_ID = "test-client-id";
process.env.APPFOLIO_DB_CLIENT_SECRET = "test-client-secret-DO-NOT-LEAK";
process.env.APPFOLIO_DB_DEVELOPER_ID = "test-developer-id";

const { callEndpointTool } = await import("../dist/tools/call-endpoint.js");
const { describeEndpointTool } = await import("../dist/tools/describe-endpoint.js");
const { guessContentType } = await import("../dist/helpers/file-upload.js");

const BILL_ID = "11111111-2222-3333-4444-555555555555";
const ATTACHMENT_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

const dir = mkdtempSync(join(tmpdir(), "appfolio-upload-test-"));
after(() => rmSync(dir, { recursive: true, force: true }));

// Binary payload with NULs, 0xFF and CRLF to prove bytes are not text-mangled.
const JPG_BYTES = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  Buffer.from("JFIF\0\r\n--not-a-boundary\r\n"),
  Buffer.from([0x00, 0xff, 0x7f, 0x80, 0xff, 0xd9]),
]);
const jpgPath = join(dir, "receipt.jpg");
writeFileSync(jpgPath, JPG_BYTES);
const emptyPath = join(dir, "empty.pdf");
writeFileSync(emptyPath, Buffer.alloc(0));
const subdir = join(dir, "a-directory");
mkdirSync(subdir);

let calls;
let responder;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), init });
  return responder(calls.length);
};
after(() => {
  globalThis.fetch = realFetch;
});

beforeEach(() => {
  calls = [];
  responder = () =>
    new Response(JSON.stringify({ Id: ATTACHMENT_ID }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
});

async function call(params) {
  const res = await callEndpointTool.handler({ params });
  return res.content[0].text;
}

/** Serialize a captured fetch call exactly as fetch would put it on the wire. */
async function wire(captured) {
  const req = new Request(captured.url, captured.init);
  return {
    contentType: req.headers.get("content-type"),
    headers: req.headers,
    bytes: Buffer.from(await req.arrayBuffer()),
  };
}

test("bill attachment: file bytes are sent as multipart under the File field", async () => {
  const text = await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    file: { path: jpgPath },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `https://api.appfolio.com/api/v0/bills/${BILL_ID}/attachments`);
  assert.equal(calls[0].init.method, "POST");
  assert.ok(calls[0].init.body instanceof FormData, "body must be FormData, not a JSON string");

  const { contentType, bytes } = await wire(calls[0]);
  const form = await new Response(bytes, { headers: { "content-type": contentType } }).formData();
  const file = form.get("File");
  assert.ok(file instanceof File, "File part must be a file, not a text field");
  assert.equal(file.name, "receipt.jpg");
  assert.equal(file.type, "image/jpeg");
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), JPG_BYTES);
  assert.deepEqual([...form.keys()], ["File"]);

  const out = JSON.parse(text);
  assert.equal(out.result.Id, ATTACHMENT_ID);
  assert.deepEqual(out.uploaded, {
    field: "File",
    filename: "receipt.jpg",
    contentType: "image/jpeg",
    bytes: JPG_BYTES.length,
  });
});

test("multipart Content-Type carries a generated boundary that delimits the body", async () => {
  await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    file: { path: jpgPath },
  });

  // We must not set Content-Type ourselves; fetch generates it with the boundary.
  assert.equal(calls[0].init.headers["Content-Type"], undefined);
  assert.equal(calls[0].init.headers["content-type"], undefined);

  const { contentType, bytes } = await wire(calls[0]);
  const m = /^multipart\/form-data; boundary=(.+)$/.exec(contentType);
  assert.ok(m, `unexpected Content-Type: ${contentType}`);
  const boundary = m[1];
  assert.ok(boundary.length >= 16);
  assert.ok(!JPG_BYTES.includes(Buffer.from(boundary)), "boundary must not occur in the file bytes");

  const raw = bytes.toString("latin1");
  assert.ok(raw.startsWith(`--${boundary}\r\n`));
  assert.ok(raw.endsWith(`\r\n--${boundary}--\r\n`));
  assert.match(raw, /Content-Disposition: form-data; name="File"; filename="receipt\.jpg"\r\n/);
  assert.match(raw, /Content-Type: image\/jpeg\r\n\r\n/);
  assert.ok(bytes.includes(JPG_BYTES), "exact file bytes must be in the body");
});

test("upload keeps Basic auth and the developer-ID header", async () => {
  await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    file: { path: jpgPath },
  });
  const { headers } = await wire(calls[0]);
  const expected = Buffer.from("test-client-id:test-client-secret-DO-NOT-LEAK").toString("base64");
  assert.equal(headers.get("authorization"), `Basic ${expected}`);
  assert.equal(headers.get("x-appfolio-developer-id"), "test-developer-id");
});

test("filename and content_type overrides are honored", async () => {
  await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    file: { path: jpgPath, filename: "Invoice 1042.jpeg", content_type: "image/jpeg" },
  });
  const { contentType, bytes } = await wire(calls[0]);
  const file = (await new Response(bytes, { headers: { "content-type": contentType } }).formData()).get("File");
  assert.equal(file.name, "Invoice 1042.jpeg");
  assert.equal(file.type, "image/jpeg");
});

test("extra form fields (marketing photo Position) are sent alongside the file", async () => {
  await call({
    operation_id: "post_properties_propertyid_marketing_photos",
    path_params: { PropertyId: BILL_ID },
    file: { path: jpgPath },
    body: { Position: 2, MarketingCategory: "Exterior" },
  });
  const { contentType, bytes } = await wire(calls[0]);
  const form = await new Response(bytes, { headers: { "content-type": contentType } }).formData();
  assert.equal(form.get("Position"), "2");
  assert.equal(form.get("MarketingCategory"), "Exterior");
  assert.ok(form.get("File") instanceof File);
});

test("missing file fails before any request is sent", async () => {
  const text = await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    file: { path: join(dir, "does-not-exist.jpg") },
  });
  assert.equal(calls.length, 0);
  assert.match(text, /File not found/);
  assert.match(text, /Nothing was sent to AppFolio/);
});

test("directories, empty files and relative paths are rejected before any request", async () => {
  for (const [path, re] of [
    [subdir, /Not a regular file/],
    [emptyPath, /File is empty/],
    ["receipt.jpg", /must be an absolute path/],
  ]) {
    const text = await call({
      operation_id: "post_bills_billid_attachments",
      path_params: { BillId: BILL_ID },
      file: { path },
    });
    assert.match(text, re);
  }
  assert.equal(calls.length, 0);
});

test("a path string in body.File (the old 422 shape) is rejected with guidance, not sent", async () => {
  const text = await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    body: { File: jpgPath },
  });
  assert.equal(calls.length, 0);
  assert.match(text, /file: \{ path:/);
});

test("upload endpoint without a file argument is rejected before any request", async () => {
  const text = await call({
    operation_id: "post_work_orders_workorderid_attachments",
    path_params: { WorkOrderId: BILL_ID },
  });
  assert.equal(calls.length, 0);
  assert.match(text, /requires the "file" argument/);
});

test("unsafe filename override is rejected", async () => {
  const text = await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    file: { path: jpgPath, filename: "../evil.jpg" },
  });
  assert.equal(calls.length, 0);
  assert.match(text, /Invalid file\.filename/);
});

test("JSON endpoints are unchanged: JSON body and application/json", async () => {
  responder = () => new Response(JSON.stringify({ Id: BILL_ID }), { status: 200 });
  const body = { Remarks: "updated", DueDate: "2026-11-15" };
  const text = await call({
    operation_id: "patch_bills_billid",
    path_params: { billId: BILL_ID },
    body,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, "PATCH");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
  assert.equal(calls[0].init.body, JSON.stringify(body));
  assert.equal(calls[0].init.signal, undefined, "JSON requests get no upload timeout");
  assert.equal(JSON.parse(text).result.Id, BILL_ID);
  assert.equal(JSON.parse(text).uploaded, undefined);
});

test("JSON endpoints reject the file argument", async () => {
  const text = await call({
    operation_id: "post_bills",
    body: { VendorId: BILL_ID },
    file: { path: jpgPath },
  });
  assert.equal(calls.length, 0);
  assert.match(text, /does not accept file uploads/);
});

test("GET requests still send no body and no Content-Type", async () => {
  responder = () => new Response(JSON.stringify({ data: [{ Id: BILL_ID }] }), { status: 200 });
  await call({ operation_id: "get_bills", filters: { Id: BILL_ID } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.body, undefined);
  assert.equal(calls[0].init.headers["Content-Type"], undefined);
});

test("a timed-out upload is reported as unknown and NOT retried", async () => {
  responder = () => {
    throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
  };
  const text = await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    file: { path: jpgPath },
  });
  assert.equal(calls.length, 1, "must not retry an ambiguous upload");
  assert.match(text, /Upload outcome unknown/);
  assert.match(text, /NOT retried/);
});

test("a dropped connection during upload is reported as unknown and NOT retried", async () => {
  responder = () => {
    throw new TypeError("fetch failed", { cause: { code: "ECONNRESET" } });
  };
  const text = await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    file: { path: jpgPath },
  });
  assert.equal(calls.length, 1);
  assert.match(text, /Upload outcome unknown: connection failed \(ECONNRESET\)/);
});

test("429 (rejected unprocessed) is retried with identical bytes", async () => {
  responder = (n) =>
    n === 1
      ? new Response("rate limited", { status: 429, headers: { "Retry-After": "0" } })
      : new Response(JSON.stringify({ Id: ATTACHMENT_ID }), { status: 201 });
  const text = await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    file: { path: jpgPath },
  });
  assert.equal(calls.length, 2);
  for (const c of calls) {
    const { contentType, bytes } = await wire(c);
    const file = (await new Response(bytes, { headers: { "content-type": contentType } }).formData()).get("File");
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), JPG_BYTES);
  }
  assert.equal(JSON.parse(text).result.Id, ATTACHMENT_ID);
});

test("HTTP errors surface without credentials or file contents", async () => {
  responder = () => new Response("File parameter specified, but no file was passed", { status: 422 });
  const text = await call({
    operation_id: "post_bills_billid_attachments",
    path_params: { BillId: BILL_ID },
    file: { path: jpgPath },
  });
  assert.match(text, /HTTP 422/);
  assert.ok(!text.includes("test-client-secret-DO-NOT-LEAK"));
  assert.ok(!text.includes(Buffer.from("test-client-id:test-client-secret-DO-NOT-LEAK").toString("base64")));
  assert.ok(!text.includes("JFIF"));
});

test("all 14 attachment/photo POST endpoints are declared multipart; describe_endpoint documents it", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const endpointsDir = new URL("../dist/catalog-db/endpoints/", import.meta.url);
  const multipart = readdirSync(endpointsDir)
    .map((f) => JSON.parse(readFileSync(new URL(f, endpointsDir), "utf8")))
    .filter((s) => s.requestBody?.contentType === "multipart/form-data")
    .map((s) => s.operationId)
    .sort();
  assert.equal(multipart.length, 14);
  for (const id of multipart) assert.match(id, /^post_.*_(attachments|photos)$/);

  const res = await describeEndpointTool.handler({ params: { operation_id: "post_bills_billid_attachments" } });
  const spec = JSON.parse(res.content[0].text);
  assert.equal(spec.fileUpload.fileField, "File");
  assert.equal(JSON.parse(spec.requestSample).file.path, "/path/to/file.pdf");
});

test("MIME types are guessed from the extension", () => {
  assert.equal(guessContentType("a.JPG"), "image/jpeg");
  assert.equal(guessContentType("a.pdf"), "application/pdf");
  assert.equal(guessContentType("a.unknownext"), "application/octet-stream");
});
