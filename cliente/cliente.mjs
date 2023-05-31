import { execSync } from "child_process";
import { Socket } from "net";

// aguarda um pouco para o server ser configurado
execSync("sleep 1");

var socket = new Socket();
socket.setEncoding("utf-8")

socket.connect(8004, "0.0.0.0", () => {
  // manda qualquer coisa so para receber resposta
  socket.write("lista");
  socket.write("clientes");
});

socket.on("data", (data) => {
  console.log(data)  
  socket.destroy();
  console.log("socket fechado");
});
