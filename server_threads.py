import socket
from concurrent.futures import ThreadPoolExecutor
from threading import Thread
import wave


class servidor:
    def __init__(self):
        self.nome_servidor = socket.gethostname()
        self.ip_servidor = socket.gethostbyname_ex(self.nome_servidor)
        self.socketServidor = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
        self.socketServidor.bind((self.ip_servidor,4400))
        self.socketServidor.listen(5)
        self.socketServidor.setblocking(False)
        self.listaConexoes = list()
        self.threads = ThreadPoolExecutor()
        self.threads.submit(self.conecta)



    def conecta(self):
        while True:
            (socketParaCliente,ipCliente) = self.socketServidor.accept()
            self.listaConexoes.append(socketParaCliente)

    def escuta(self):
        while True:
            for conexao in self.listaConexoes:
                request = conexao.recv(4000)
                if(request!=None):
                    processa = Thread(target=self.resposta,args=(conexao,request),daemon=True)
                    

    def resposta(self,conexao,request):
        w = wave.open("audio.wav", "rb")
        bynary_data = w.readframes(w.getnframes())
        w.close()
        conexao.send(bynary_data)





        
    





