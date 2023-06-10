const list = [
  {
    nome: "Mc pipoka",
    length: "2:34",
  },
];

var lista_musicas;

const card = (music, callback) => {
  let components = {
    root: document.createElement("div"),
  };

  let playBtnHandler = () => {
    callback(music);
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

const player = () => {
  let elements = {
    root: document.querySelector(".player"),
    playPauseBtn: document.querySelector(".player").querySelector("button"),
    playPauseImg: document.querySelector(".player").querySelector("img"),
    info: document.querySelector(".music-info"),
  };

  let state = {
    music: null,
    isPlaying: false,
    context: null,
    chunksLoaded: 0,
    interval: null,
  };

  let render = (socket) => {
    setHandlers(socket);

    if (!state.music) elements.playPauseBtn.disabled = true;
  };

  let setActiveMusic = (music) => {
    state.music = music;
    elements.playPauseBtn.disabled = false;

    elements.info.innerHTML = `<p>${music.nome}</p>`;

    if (state.context) state.context?.close();

    state.context = new AudioContext();
  };

  let onMessageCallback = (buff) => {
    state.context.decodeAudioData(
      buff,
      (sourceBuffer) => {
        var soundSource = state.context.createBufferSource();
        soundSource.buffer = sourceBuffer;
        soundSource.connect(state.context.destination);
        soundSource.start(0 + 30 * state.chunksLoaded);
        state.chunksLoaded++;
        if (!state.isPlaying) context.suspend();
      },
      (e) => {
        console.log(e);
      }
    );
  };

  let setHandlers = (socket) => {
    elements.playPauseBtn.addEventListener("click", () => {
      handlePlayPause(socket);
    });
  };

  let handlePlayPause = (sock) => {
    if (state.isPlaying) {
      state.isPlaying = false;
      elements.playPauseImg.src = "assets/play-button-svgrepo-com.svg";
      if (state.context) state.context.suspend();
      clearInterval(state.interval);
      state.interval = null;
    } else {
      request = "manda musica " + state.music["nome"] + " " + state.chunksLoaded;

      state.isPlaying = true;
      elements.playPauseImg.src = "assets/pause-circle-svgrepo-com.svg";
      if (state.context) state.context.resume();
      if (state.chunksLoaded == 0){
        sock.send(request);
      }
      state.interval = setInterval(() => {
        request = "manda musica " + state.music["nome"] + " " + state.chunksLoaded;
        sock.send(request);
      }, 10000);
    }
  };

  return {
    render,
    setActiveMusic,
    onMessageCallback,
  };
};

const cardList = () => {
  let elements = {
    root: document.querySelector(".music-list"),
  };

  let state = {
    musicList: [],
    playerCallback: null,
  };

  let setMusicList = (musicList, callback) => {
    state.musicList = musicList;
    state.playerCallback = callback;

    render();
  };

  let render = () => {
    if (state.musicList.length == 0) return;

    while (elements.root.firstChild)
      elements.root.removeChild(elements.root.firstChild);

    state.musicList.forEach((music) => {
      const musicCard = card(music, state.playerCallback).render();

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
    player: player(),
  };

  let state = {
    socket: null,
  };

  let handleMusicList = (list) => {
    components.cardList.setMusicList(list, components.player.setActiveMusic);
  };

  let render = () => {
    state.socket = socketConnect(
      components.player.onMessageCallback,
      handleMusicList
    );
    components.player.render(state.socket);
  };

  return {
    render,
  };
};

const socketConnect = (handleMusic, handleList) => {
  const sock = new WebSocket("ws://localhost:8000");
  sock.binaryType = "arraybuffer";

  let wav = new window.wavefile.WaveFile();

  sock.onopen = () => {
    console.log("Websocket conectado");
    sock.send("manda lista");
  };

  sock.onmessage = async (msg) => {
    if (msg.data instanceof ArrayBuffer) {
      const message = msg.data;

      const chunk = new Int16Array(message);
      console.log(player.state);
      //wav.fromScratch(2, player.state.music["framerate"]*1, "16", chunk);
      wav.fromScratch(2, 16000, "16", chunk);

      const buff = wav.toBuffer().buffer;

      handleMusic(buff);
    } else {
      let data = JSON.parse(msg.data);
      handleList(data);
    }
  };

  sock.onerror = (error) => console.log("Websocket error", error);

  sock.onclose = () => {
    console.log("Disconected from the Websocket Server");
  };

  return sock;
};

page().render();
