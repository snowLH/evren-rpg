#!/usr/bin/env python3
"""
SERVIDOR LOCAL SEGURO: MESA HISTÓRICA & VTT DO UNIVERSO EVREN
Inicializa servidor HTTP restrito estritamente a 127.0.0.1 (localhost),
com bloqueio de path-traversal, cabeçalhos de segurança, restrição de arquivos
sensíveis e encerramento gracioso.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from urllib.parse import unquote, urlparse

HOST = "127.0.0.1"
PORT = 8000
MAX_PORT_ATTEMPTS = 10

# Extensões e pastas estritamente proibidas de serem servidas via HTTP
FORBIDDEN_EXTENSIONS = {
    '.py', '.pyc', '.bat', '.cmd', '.ps1', '.sh', '.bash',
    '.env', '.key', '.pem', '.log', '.bak', '.backup'
}

FORBIDDEN_PREFIXES = {
    '.git', '.github', '.gemini', '__pycache__', 'node_modules'
}

class SecureEvrenRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    Handler seguro com restrição de diretório, cabeçalhos defensivos
    e bloqueio de listagem arbitrária de pastas.
    """

    def __init__(self, *args, **kwargs):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        super().__init__(*args, directory=script_dir, **kwargs)

    def is_safe_path(self, path: str) -> bool:
        """Valida se o caminho solicitado está dentro do diretório raiz e não acessa arquivos sensíveis."""
        try:
            parsed = urlparse(path)
            clean_path = unquote(parsed.path)

            # Bloqueia explicitamente qualquer tentativa de travessia de pasta
            if '..' in clean_path or '..' in path or clean_path.startswith('/..'):
                return False

            normalized = os.path.normpath(clean_path).lstrip('/\\')
            parts = normalized.split(os.sep)

            for part in parts:
                if part.startswith('.') and part != '.' and part != '..':
                    return False
                if part.lower() in FORBIDDEN_PREFIXES:
                    return False

            base_dir = os.path.dirname(os.path.abspath(__file__))
            full_path = os.path.realpath(os.path.join(base_dir, normalized))

            # Verifica se o arquivo final reside dentro da raiz do projeto
            if not full_path.startswith(base_dir):
                return False

            # Bloqueia extensões proibidas
            _, ext = os.path.splitext(full_path)
            if ext.lower() in FORBIDDEN_EXTENSIONS:
                return False

            return True
        except Exception:
            return False

    def do_GET(self):
        if not self.is_safe_path(self.path):
            self.send_error(403, "Acesso Negado: Recurso restrito por políticas de segurança locais.")
            return

        # Redireciona raiz para index.html
        if self.path in ('', '/', '/index'):
            self.path = '/index.html'

        super().do_GET()

    def do_HEAD(self):
        if not self.is_safe_path(self.path):
            self.send_error(403, "Acesso Negado")
            return
        super().do_HEAD()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        # Servidor é 100% estático local; rejeita métodos de escrita arbitrária
        self.send_error(405, "Método não permitido: Servidor local opera em modo somente-leitura.")

    def list_directory(self, path):
        # Desabilita listagem de diretórios para evitar exposição de estrutura interna
        self.send_error(403, "Acesso Negado: Listagem de diretórios desabilitada por segurança.")
        return None

    def end_headers(self):
        # Cabeçalhos de Segurança Defensivos
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', f"http://{HOST}:{PORT}")
        self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        elif path.endswith('.json'):
            return 'application/json; charset=utf-8'
        elif path.endswith('.css'):
            return 'text/css; charset=utf-8'
        elif path.endswith('.svg'):
            return 'image/svg+xml'
        elif path.endswith('.html'):
            return 'text/html; charset=utf-8'
        return super().guess_type(path)

    def log_message(self, format, *args):
        # Log limpo e sem poluição de terminal
        sys.stdout.write(f"[{self.log_date_time_string()}] {self.address_string()} - {format % args}\n")

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

# Alias para compatibilidade com testes anteriores
CustomHTTPRequestHandler = SecureEvrenRequestHandler

def start_server():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    global PORT
    httpd = None
    for attempt in range(MAX_PORT_ATTEMPTS):
        current_port = PORT + attempt
        try:
            httpd = ReusableTCPServer((HOST, current_port), SecureEvrenRequestHandler)
            PORT = current_port
            break
        except OSError:
            print(f"[!] Porta {current_port} em uso, tentando porta seguinte...")

    if not httpd:
        print(f"[ERRO] Falha ao vincular portas entre {PORT} e {PORT + MAX_PORT_ATTEMPTS} em {HOST}.")
        sys.exit(1)

    url = f"http://{HOST}:{PORT}/index.html"
    print("=" * 65)
    print("  MUSEU HISTÓRICO & VTT DO UNIVERSO EVREN")
    print(f"  Servidor Local Seguro Ativo em: {url}")
    print(f"  Interface Vinculada: {HOST} (Acesso externo bloqueado)")
    print("  Pressione Ctrl+C para encerrar o servidor com segurança.")
    print("=" * 65)

    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[i] Abra o endereço manualmente no seu navegador: {url} ({e})")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[✓] Servidor encerrado com sucesso pelo usuário.")
    finally:
        httpd.server_close()

if __name__ == '__main__':
    start_server()
