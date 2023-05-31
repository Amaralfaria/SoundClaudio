const btn = document.querySelector(".btn")

btn.addEventListener("click", () => {
  try {
    const sock = new WebSocket("ws://127.0.1.1:8000")

    
    console.log(sock) 

    sock.onmessage((msg) => {
      console.log(msg)
    })
  } catch (e) {
    console.log(e)
  }
})
