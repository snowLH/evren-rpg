#!/usr/bin/env python3
"""
SERVIDOR LOCAL: MESA INTERATIVA DO UNIVERSO EVREN
Inicializa servidor HTTP com CORS, tratamento de MIME types e abertura automática de navegador.
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8000
MAX_PORT_ATTEMPTS = 10

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Habilita CORS e desabilita cache local durante desenvolvimento de RPG
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        # Assegura tipos MIME corretos para arquivos web modernos
        if path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.json'):
            return 'application/json'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.svg'):
            return 'image/svg+xml'
        return super().guess_type(path)

def start_server():
    # Garante que o diretório de trabalho é o do script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    global PORT
    httpd = None
    for attempt in range(MAX_PORT_ATTEMPTS):
        current_port = PORT + attempt
        try:
            handler = CustomHTTPRequestHandler
            httpd = socketserver.TCPServer(("", current_port), handler)
            PORT = current_port
            break
        except OSError:
            print(f"[!] Porta {current_port} em uso, tentando porta seguinte...")

    if not httpd:
        print(f"[ERRO] Falha ao vincular portas entre {PORT} e {PORT + MAX_PORT_ATTEMPTS}.")
        sys.exit(1)

    url = f"http://localhost:{PORT}/index.html"
    print("=" * 65)
    print("  MESA INTERATIVA DE RPG — UNIVERSO EVREN")
    print(f"  Servidor ativo em: {url}")
    print("  Diretório raiz:", script_dir)
    print("  Pressione Ctrl+C para encerrar o servidor.")
    print("=" * 65)

    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[!] Não foi possível abrir o navegador automaticamente: {e}")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[✓] Servidor encerrado com sucesso pelo mestre da mesa.")
        httpd.server_close()

if __name__ == '__main__':
    start_server()
