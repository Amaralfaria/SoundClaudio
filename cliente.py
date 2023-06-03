import json
import time
import socket
from concurrent.futures import ThreadPoolExecutor
from server2 import Server

def cliente():
    socket_cliente_thread = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    hostname = socket.gethostname()
    ipAddr = socket.gethostbyname(hostname)

    time.sleep(2)
    
    socket_cliente_thread.connect((ipAddr, 8000))

    mensagens = ["lista", "clientes"]
    
    for mensagem in mensagens:
        # Transforma dicionário em JSON e em seguida para bytes
        mensagem_bytes = json.dumps(mensagem).encode("utf-8")

        # envia mensagem ao servidor
        socket_cliente_thread.send(mensagem_bytes)
        msg = socket_cliente_thread.recv(4000)
        print("Cliente:", json.loads(msg.decode("utf-8")))
    socket_cliente_thread.close()
    print("Cliente:", socket_cliente_thread)
    
threadPool = ThreadPoolExecutor()
threadPool.submit(cliente)

servidor = Server()
del servidor