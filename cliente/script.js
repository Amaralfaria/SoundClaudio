const list = [
  {
    nome: "Mc pipoka",
    length: "2:34",
  },
];

var lista_musicas;

const card = (music) => {
  let components = {
    root: document.createElement("div"),
  };

  let state = {
    isPlaying: false,
    interval: null,
  };

  let playMusic = () => {
    let audio = document.querySelector("audio");
    audio.play();
    state.interval = setInterval(() => {
      console.log("musica tocando");
    }, 1000);
  };

  let playBtnHandler = () => {
    if (state.isPlaying) {
      state.isPlaying = false;
      clearInterval(state.interval);
      console.log("musica pausada");
      state.interval = null;
    } else {
      state.isPlaying = true;
      playMusic();
    }
  };

  let render = () => {
    components.root.classList.add("music-card");

    const playBtn = document.createElement("button");
    playBtn.innerHTML =
      "<img src='assets/play-button-svgrepo-com.svg' alt=''/>";

    playBtn.addEventListener("click", playBtnHandler);

    components.root.innerHTML = `<h3>${music.nome}</h3`;

    components.root.appendChild(playBtn);

    return components.root;
  };

  return {
    render,
  };
};

const cardList = () => {
  let elements = {
    root: document.querySelector(".music-list"),
  };

  let state = {
    musicList: [],
  };

  let setMusicList = (musicList) => {
    state.musicList = musicList;

    render();
  };

  let render = () => {
    if (state.musicList.length == 0) return;

    while (elements.root.firstChild)
      elements.root.removeChild(elements.root.firstChild);

    state.musicList.forEach((music) => {
      const musicCard = card(music).render();

      elements.root.appendChild(musicCard);
    });
  };

  return {
    render,
    setMusicList,
  };
};

const page = () => {
  let components = {
    cardList: cardList(),
  };

  let state = {
    socket: null,
  };

  let render = () => {
    state.socket = socketConnect();

    components.cardList.setMusicList(list);
  };

  return {
    render,
  };
};

const socketConnect = () => {
  const sock = new WebSocket("ws://127.0.1.1:8000");

  sock.onopen = (e) => {
    console.log("Websocket conectado");
    
    sock.send("manda lista");
    sock.send("manda musica nome_musica");
  };

  sock.onmessage = async (msg) => {
    const message = msg.data;
    console.log(typeof message);
  
    console.log("I got a message!", message);
    //aqui é tratado a musica
    if (typeof message == "object") {
      // const audio = document.createElement("audio");
      // audio.controls = true;
      const audio = document.getElementById("taylor.wav")

      var reader = new FileReader();

      reader.onloadend = function (e) {
        const arrayBuffer = e.target.result;

        let wav = new window.wavefile.WaveFile();
        wav.fromScratch(2, 44100, "16", new Int16Array(arrayBuffer));
        audio.src += wav.toDataURI();
        //sock.send("manda musica") //ta dando problema quando nao é criado um novo audio para cada 30s
      };
      reader.readAsArrayBuffer(message);

      // document.querySelector(".music-list").appendChild(audio);
    }else if(typeof message == "string"){
      lista_musicas = JSON.parse(message)
      lista_musicas.forEach(function(info){
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.setAttribute("id",info["nome"])
        document.querySelector(".music-list").appendChild(audio);

      })


    }
  };

  sock.onerror = (error) => console.log("Websocket error", error);

  sock.onclose = (e) => console.log("Disconected from the Websocket Server");
  //});

  return sock;
};

page().render();
