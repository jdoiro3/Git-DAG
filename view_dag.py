import http.server as server
import sys
import threading
import webbrowser
import time

host = "127.0.0.1"
port = 8888

def start_server(host=host, port=port, handler=server.CGIHTTPRequestHandler):
    # open the browser
    webbrowser.open_new(f"http://localhost:{port}")
    # start the server
    handler.protocol_version = "HTTP/1.0"
    with server.ThreadingHTTPServer((host, port), handler) as httpd:
        url_host = f'[{host}]' if ':' in host else host
        print(
            f"Serving HTTP on {host} port {port} "
            f"(http://{url_host}:{port}/) ..."
        )
        print("Press ctrl^C to kill server ...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nKeyboard interrupt received, exiting.")
            sys.exit(0)

if __name__ == "__main__":
    start_server()