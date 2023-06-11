const modal = () => {
  let elements = {
    overlay: document.querySelector(".modal-overlay"),
    form: document.querySelector("form"),
    playBtn: document.querySelector(".play-remote"),
    lista: document.querySelector(".lista-clientes"),
  };

  let state = {
    socket: null,
    musicas: [],
  };

  let setMusicas = (musicas) => {
    state.musicas = musicas;
  };

  let setSocket = (socket) => {
    state.socket = socket;
  };

  let render = () => {
    elements.playBtn.addEventListener("click", (e) => {
      e.preventDefault();
      createForm();
    });
  };

  let createForm = () => {
    let form = elements.form;

    state.musicas.forEach((musica) => {
      let container = document.createElement("div");
      let input = document.createElement("input");
      input.type = "radio";
      input.value = musica.path;
      input.name = "musica";
      input.id = `musica-${musica.id}`;

      let label = document.createElement("label");
      label.innerText = `${musica.nome}`;
      label.htmlFor = `musica-${musica.id}`;

      form.appendChild(document.createElement("br"));
      container.appendChild(input);
      container.appendChild(label);
      form.appendChild(container);
    });
  };

  let createClientList = () => {
    let sock = state.socket;

    sock.send("manda usuarios");
  };

  return {
    render,
    setMusicas,
    setSocket,
  };
};

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
  let wav = new window.wavefile.WaveFile();

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
    if (state.music && state?.music?.nome == music.nome) return;

    state.music = music;

    state.chunksLoaded = 0;

    if (state.isPlaying) {
      state.isPlaying = false;
      state.isPlaying = false;
      elements.playPauseImg.src = "assets/play-button-svgrepo-com.svg";
    }
    if (state.interval) {
      clearInterval(state.interval);
      state.interval = null;
    }

    elements.playPauseBtn.disabled = false;

    elements.info.innerHTML = `<p>${music.nome}</p>`;

    if (state.context) state.context?.close();

    state.context = new AudioContext();
  };

  let onMessageCallback = (msg) => {
    const message = msg.data;
    const chunk = new Int16Array(message);
    //wav.fromScratch(2, player.state.music["framerate"]*1, "16", chunk);
    wav.fromScratch(2, state.music["framerate"] * 1, "16", chunk);

    const buff = wav.toBuffer().buffer;
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
      request =
        "manda musica " + state.music["path"] + " " + state.chunksLoaded;

      state.isPlaying = true;
      elements.playPauseImg.src = "assets/pause-circle-svgrepo-com.svg";
      if (state.context) state.context.resume();
      if (state.chunksLoaded == 0) {
        sock.send(request);
      }
      state.interval = setInterval(() => {
        request =
          "manda musica " + state.music["path"] + " " + state.chunksLoaded;
        sock.send(request);

        if ((state.chunksLoaded + 1) * 30 >= state.music["duracao"] * 1) {
          clearInterval(state.interval);
        }
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
    modal: modal(),
  };

  let state = {
    socket: null,
  };

  let handleMusicList = (list) => {
    components.cardList.setMusicList(list, components.player.setActiveMusic);
    components.modal.setMusicas(list);
  };

  let render = () => {
    state.socket = socketConnect(
      components.player.onMessageCallback,
      handleMusicList
    );
    components.player.render(state.socket);
    components.modal.setSocket(state.socket);
    components.modal.render();
  };

  return {
    render,
  };
};

const socketConnect = (handleMusic, handleList) => {
  const sock = new WebSocket("ws://192.168.150.114:8000");
  sock.binaryType = "arraybuffer";

  // let wav = new window.wavefile.WaveFile();

  sock.onopen = () => {
    console.log("Websocket conectado");
    sock.send("manda lista");
    //sock.send("manda usuarios");
  };

  sock.onmessage = async (msg) => {
    console.log(msg);
    if (msg.data instanceof ArrayBuffer) {
      handleMusic(msg);
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

//nome = window.prompt("Qual seu nome?")

page().render();
