import socket
import time
import wave

# configura socket do servidor
socketServidor = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
nomeServidor = socket.gethostname()
ipServidor = socket.gethostbyname_ex(nomeServidor)
socketServidor.bind((ipServidor[2][0], 4400))

socketServidor.listen(1)

# espera conexão do cliente
(socketParaCliente, enderecoDoCliente) = socketServidor.accept()
time.sleep(1)

msgRecebida = socketParaCliente.recv(4000)
time.sleep(1)

# abre o aruqivo do audio
w = wave.open("audio.wav", "rb")

bynary_data = w.readframes(w.getnframes())

w.close()

# envia o audio todo
socketParaCliente.send(bynary_data)
time.sleep(1)

socketServidor.close()
