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
    def __init__(self, endereco_servidor="0.0.0.0", porta_servidor=8000, max_conexoes=10):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

        self.socket.bind((endereco_servidor, porta_servidor))

        print(endereco_servidor, porta_servidor)

        self.socket.listen(max_conexoes)

        self.threadClientes = []
        self.clientes = []

        self.threadEscuta = Thread(target=self.implementacaoThreadEscuta, daemon=True)
        self.threadEscuta.run()

    def implementacaoThreadEscuta(self):
        contador = 0
        while True:
            (socketParaCliente, enderecoDoCliente) = self.socket.accept()
            self.clientes.append({
                "id": contador,
                "endereco": enderecoDoCliente[0],
                "porta": enderecoDoCliente[1],
                "socket": socketParaCliente,
                "nome": "joao"
            })
            contador+=1
            print(enderecoDoCliente)
            novaThread = Thread(target=self.implementacaoThreadCliente,
                                args=(enderecoDoCliente, socketParaCliente),
                                daemon=True)

            novaThread.start()
            self.threadClientes.append(novaThread)

    def implementacaoThreadCliente(self, enderecoDoCliente, socketParaCliente):
        max_messages = 10
        
        # depois deixar esse pointer ser mandado pelo proprio cliente
        while max_messages > 0:
            socketRemoto = None
            try: 
                mensagem = socketParaCliente.recv(4000)
                response = ""

                try:
                    msg = mensagem.decode('utf-8')
                    response = self.http_upgrade(msg)
                    response = response.encode('utf-8')
                except:
                    msg = self.decode_websocket_msg(mensagem)
                    response, socketRemoto = self.handle_websocket_msg(msg)
            except:
                socketParaCliente.close()
                return 

            print("resposta enviada: ")
            if socketRemoto == None:
                socketParaCliente.send(response)
            else:
                socketRemoto.send(response)


            
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

    def handle_websocket_msg(self, msg):
        data = msg
        remoto = None


        if 'cliente' in  msg.decode():
            info = msg.decode().split()
            id = info[1]
            play_pause = info[2]
            caminho_musica = info[3]
            data = play_pause + " " + caminho_musica
            for cliente in self.clientes:
                if id == cliente["id"]:
                    remoto = cliente["socket"]
                    break

        if msg == b'manda usuarios':
            data = []
            for cliente in self.clientes:
                data.append(cliente["id"])
            data = json.dumps(data).encode()
            
            

        if msg == b'manda lista':
            data = json.dumps(info_musicas).encode()

        if 'manda musica' in msg.decode():
            # isso aqui é pra quando der pra escolher a musica
            lista = msg.decode().split()
            caminho_musica = lista[2]
            pointer = int(lista[3])
            
            print(caminho_musica)

            w = wave.open(os.path.join(os.path.dirname(__file__), caminho_musica) , "rb")

            # w = wave.open(os.path.join(os.path.dirname(__file__), 'musicas/taylor.wav') , "rb")
            print(pointer)
            try:
                w.setpos(30*pointer*w.getframerate())
            except Exception as e:
                print(e)
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

        return response, remoto
    
    


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
            "nome": "De Fundo - Desconhecido",
            "path": "musicas/audio.wav",
            "duracao": 0,
            "framerate": 0
        },
        {
            "id": 1,
            "nome":"Love Story - Taylor",
            "path": "musicas/taylor.wav",
            "duracao": 0,
            "framerate": 0
        }
]


for d in info_musicas:
    w = wave.open(os.path.join(os.path.dirname(__file__), d["path"]) , "rb")
    framerate = w.getframerate()
    d["framerate"] = framerate
    d["duracao"] = int(w.getnframes()/framerate)
    print(d["duracao"])
    w.close()


# musicas_dir = os.listdir('musicas')
# w = wave.open('musicas/audio.wav',"rb")
# print(w.getsampwidth(),w.getframerate())
# w.close()

Server()
