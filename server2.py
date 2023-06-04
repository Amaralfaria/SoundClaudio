import socket
import time
import wave
import json
from threading import Thread

list = [
        {
            "id": 0,
            "nome": "audio.wav",
            "path": "./audio.wav"
        }
]

class Server:
    def __init__(self, endereco_servidor="0.0.0.0", porta_servidor=8000, max_conexoes=1):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.bind((endereco_servidor, porta_servidor))
        print(endereco_servidor, porta_servidor)
        self.socket.listen(max_conexoes)
        self.threadClientes = []
        self.clientes = []

        self.threadEscuta = Thread(target=self.implementacaoThreadEscuta)
        self.threadEscuta.run()

    def implementacaoThreadEscuta(self):
        while True:
            (socketParaCliente, enderecoDoCliente) = self.socket.accept()
            print("recebeu mensagem")
            novaThread = Thread(target=self.implementacaoThreadCliente,
                                args=(enderecoDoCliente, socketParaCliente),
                                daemon=True)
            cliente = {
                    "endereco": enderecoDoCliente
                }
            self.clientes.append(cliente)
            novaThread.run()

    def implementacaoThreadCliente(self, enderecoDoCliente, socketParaCliente):
        max_messages = 3
        
        while max_messages > 0:
            mensagem = socketParaCliente.recv(512)
            print(f"{enderecoDoCliente} enviou {mensagem}")

            if mensagem == b'"lista"':
                resposta = json.dumps(list).encode("utf-8")
                socketParaCliente.send(resposta)
                

            if mensagem == b'"clientes"':
                resposta = json.dumps(self.clientes).encode("utf-8")
                socketParaCliente.send(resposta)
                

            response = b'HTTP/1.1 101 Switching Protocols\n'
            response += b'Upgrade: websocket\n'
            response += b'Connection: Upgrade\n'

            print(f"{enderecoDoCliente} recebeu {resposta}")
            socketParaCliente.send(response)
            max_messages -= 1

        self.socket.close()



# # configura socket do servidor
# socketServidor = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# nomeServidor = socket.gethostname()
# ipServidor = socket.gethostbyname_ex(nomeServidor)
# socketServidor.bind((ipServidor[2][0], 4400))
#
# socketServidor.listen(1)
#
# # espera conexão do cliente
# (socketParaCliente, enderecoDoCliente) = socketServidor.accept()
# time.sleep(1)
#
# msgRecebida = socketParaCliente.recv(4000)
# time.sleep(1)
#
# # abre o aruqivo do audio
# w = wave.open("audio.wav", "rb")
#
# bynary_data = w.readframes(w.getnframes())
#
# w.close()
#
# # envia o audio todo
# socketParaCliente.send(bynary_data)
# time.sleep(1)
#
# socketServidor.close()
