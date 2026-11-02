"""Preview-only shim: forwards /api/* (routed here by the ingress) to the Next.js app on :3000."""
import httpx
from fastapi import FastAPI, Request
from starlette.background import BackgroundTask
from starlette.responses import StreamingResponse

UPSTREAM = "http://127.0.0.1:3000"
HOP = {"connection", "keep-alive", "transfer-encoding", "te", "upgrade", "proxy-authorization", "trailer", "content-length", "host"}

app = FastAPI()
client = httpx.AsyncClient(base_url=UPSTREAM, timeout=httpx.Timeout(600.0, connect=10.0))


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy(path: str, request: Request):
    headers = [(k, v) for k, v in request.headers.items() if k.lower() not in HOP]
    req = client.build_request(request.method, "/" + path, params=request.query_params, headers=headers, content=request.stream())
    resp = await client.send(req, stream=True)
    out = StreamingResponse(resp.aiter_raw(), status_code=resp.status_code, background=BackgroundTask(resp.aclose))
    for k, v in resp.headers.multi_items():
        if k.lower() not in HOP:
            out.raw_headers.append((k.lower().encode("latin-1"), v.encode("latin-1")))
    return out
