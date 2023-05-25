import { execSync } from "child_process";
import { Socket } from "net";

// aguarda um pouco para o server ser configurado
execSync("sleep 1");

var socket = new Socket();

socket.connect(4400, "127.0.1.1", () => {
  // manda qualquer coisa so para receber resposta
  socket.write("oi");
});

socket.on("data", () => {
  console.log("mesagem Recebida");
  socket.destroy();
  console.log("socket fechado");
});
