import socket
import os
import time
import wave
import json
import hashlib
import base64
from threading import Thread

WEBSOCKET_MAGIC_STRING_KEY = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'


class Server:
    def __init__(self, endereco_servidor="127.0.1.1", porta_servidor=8000, max_conexoes=10):
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
            print("novo cliente")

            novaThread = Thread(target=self.implementacaoThreadCliente,
                                args=(enderecoDoCliente, socketParaCliente),
                                daemon=True)
            cliente = {
                    "endereco": enderecoDoCliente
                }
            self.clientes.append(cliente)
            novaThread.run()

    def implementacaoThreadCliente(self, enderecoDoCliente, socketParaCliente):
        max_messages = 10
        pointer_song = 0
        # depois deixar esse pointer ser mandado pelo proprio cliente
        while max_messages > 0:

            try: 
                mensagem = socketParaCliente.recv(4000)
                response = ""

                try:
                    msg = mensagem.decode('utf-8')
                    print(msg)
                    response = self.http_upgrade(msg)
                    response = response.encode('utf-8')
                except:
                    msg = self.decode_websocket_msg(mensagem)
                    print(msg)
                    response, pointer_song = self.handle_websocket_msg(msg,pointer_song)
            except:
                socketParaCliente.close()
                return 

            print("resposta enviada: ")
            socketParaCliente.send(response)
            
            max_messages -= 1

    def http_upgrade(self, msg):
        msg = msg.split()
        idx = msg.index("Sec-WebSocket-Key:")

        sockKey = msg[idx + 1]

        acceptKey = self.createSocketAccept(sockKey)

        response = ["HTTP/1.1 101 Web Socket Protocol Handshake",
                    "Server: go/echoserver",
                    "Upgrade: WebSocket",
                    "Connection: Upgrade",
                    "Sec-WebSocket-Accept: " + acceptKey,
                    "",
                    "" ]

        return "\r\n".join(response)


    


    def decode_websocket_msg(self, msg):
        current_byte = 1

        second_byte = msg[current_byte]

        is_masked = second_byte >> 7
        check_payload_length = second_byte & (~128)

        payload_length = 0

        if is_masked == 0: 
            return b'message not masked'

        if check_payload_length < 126:
            print("chegou uma pequena")
            payload_length = check_payload_length
            current_byte += 1

        if check_payload_length == 126:
            print("chegou uma media")
            payload_length = msg[2] << 8 | msg[3]
            current_byte += 3

        if check_payload_length == 127:
            print("chegou uma grande")
            payload_length = msg[2] << 56 | msg[3] << 48 | msg[4] << 40 | msg[5] << 32 | msg[6] << 24 | msg[7] << 16 | msg[8] << 8 | msg[9]
            current_byte += 9

        mask_key = [msg[current_byte + i] for i in range(4)]

        current_byte += 4

        encoded = b''

        for i in range(payload_length):
            encoded += msg[i + current_byte].to_bytes(length=1, signed=False)

        decoded = b''

        for i in range(payload_length):
            val = encoded[i] ^ mask_key[i % 4]
            decoded += val.to_bytes(length=1, signed=False)

        print(decoded)

        return decoded

    def handle_websocket_msg(self, msg, pointer = 0):
        data = msg

        if msg == b'payload too long': 
            data = msg

        if msg == b'message not masked':
            data = msg

        if msg == b'oi':
            data = b'salve pai'

        if msg == b'manda lista':
            data = json.dumps(info_musicas).encode()

        if b'manda musica' == msg:
            # isso aqui é pra quando der pra escolher a musica
            # lista = msg.decode().split()
            # nome__musica = lista[2]
            # pointer = lista[3]
            # caminho_musica = 'musicas/' + nome__musica

            # w = wave.open(os.path.join(os.path.dirname(__file__), caminho_musica) , "rb")


            w = wave.open(os.path.join(os.path.dirname(__file__), 'musicas/taylor.wav') , "rb")
            w.setpos(30*pointer*w.getframerate())
            data = w.readframes(w.getframerate()*30)
            pointer += 1
            w.close()

        response = b'' 

        if len(data) < 126:
            firstByte = 0x80 | 0x01
            response += firstByte.to_bytes(length=1, signed=False)
            response += len(data).to_bytes(length=1, signed=False)
        elif len(data) <= 2 ** 16:
            firstByte = 0x80 | 0x01
            response += firstByte.to_bytes(length=1, signed=False)
            response += (126).to_bytes(length=1, signed=False)
            response += (len(data) >> 8).to_bytes(length=1, signed=False)
            response += (len(data) & 0b11111111).to_bytes(length=1, signed=False)
        else: 
            firstByte = 0x80 | 0x02
            response += firstByte.to_bytes(length=1, signed=False)
            response += (127).to_bytes(length=1, signed=False)
            for i in range(8):
                num = (len(data) >> (56 - (8 * i))) & 0b11111111
                response += num.to_bytes(length=1, signed=False)

        response += data

        return response, pointer
    
    


    def createSocketAccept(self, id):
        hash = hashlib.sha1()
        hash.update((id + WEBSOCKET_MAGIC_STRING_KEY).encode('utf-8'))
        digest = hash.digest()
        return base64.b64encode(digest).decode('utf-8')


#hostname = socket.gethostname()
#ipAddr = socket.gethostbyname(hostname)

info_musicas = [
        {
            "id": 0,
            "nome": "audio.wav",
            "path": "./audio.wav",
            "duracao": 33
        },
        {
            "id": 1,
            "nome":"taylor.wav",
            "path": "./taylor.wav",
            "duracao": 236
        }
]

# musicas_dir = os.listdir('musicas')
# w = wave.open('musicas/audio.wav',"rb")
# print(w.getsampwidth(),w.getframerate())
# w.close()

Server()
