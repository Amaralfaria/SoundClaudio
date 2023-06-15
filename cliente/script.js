const modal = () => {
  let elements = {
    overlay: document.querySelector(".modal-overlay"),
    form: document.querySelector("form"),
    playBtn: document.querySelector(".play-remote"),
    cancelBtn: document.querySelector(".cancel-modal"),
    lista: document.querySelector(".lista-clientes"),
    listaMusicas: document.querySelector(".modal-lista-musicas"),
  };

  let state = {
    socket: null,
    musicas: [],
    clientes: [],
    isOpen: false,
  };

  let setMusicas = (musicas) => {
    state.musicas = musicas;
  };

  let setSocket = (socket) => {
    state.socket = socket;
  };

  let setClientes = (clientes) => {
    state.clientes = clientes;
    createClientList(clientes);
  };

  let render = () => {
    elements.playBtn.addEventListener("click", (e) => {
      e.preventDefault();

      let musica = document.querySelector(
        'input[name="musica"]:checked'
      )?.value;

      if (!musica) alert("por favor selecione uma musica");

      let cliente = document.querySelector(
        'input[name="cliente"]:checked'
      )?.value;

      if (!cliente) alert("por favor selecione uma musica");

      let mensagem = "cliente " + cliente + " play " + musica;

      state.socket.send(mensagem);

      toggleModal();

      elements.form.reset();
    });

    elements.cancelBtn.addEventListener("click", () => {
      console.log("fechou");
      toggleModal();
    });
  };

  let toggleModal = () => {
    if (state.isOpen) {
      elements.overlay.classList.remove("visible");
      state.isOpen = false;
    } else {
      elements.overlay.classList.add("visible");
      createForm();
      state.socket.send("manda usuarios");
      state.isOpen = true;
    }
  };

  let createForm = () => {
    let listaMusicas = elements.listaMusicas;

    while (listaMusicas.firstChild)
      listaMusicas.removeChild(listaMusicas.firstChild);

    state.musicas.forEach((musica) => {
      let container = document.createElement("div");
      let input = document.createElement("input");
      input.type = "radio";
      input.value = musica.path;
      input.name = "musica";
      input.id = `musica-${musica.id}`;
      input.required = true;

      let label = document.createElement("label");
      label.innerText = `${musica.nome}`;
      label.htmlFor = `musica-${musica.id}`;

      container.appendChild(input);
      container.appendChild(label);
      listaMusicas.appendChild(container);
    });
  };

  let createClientList = (clientes) => {
    while (elements.lista.firstChild)
      elements.lista.removeChild(elements.lista.firstChild);

    clientes.forEach((cliente) => {
      let container = document.createElement("div");

      let input = document.createElement("input");
      input.type = "radio";
      input.value = cliente;
      input.name = "cliente";
      input.id = `cliente-${cliente}`;
      input.required = true;

      let label = document.createElement("label");
      label.innerText = `${cliente}`;
      label.htmlFor = `cliente-${cliente}`;

      container.appendChild(input);
      container.appendChild(label);

      elements.lista.appendChild(container);
    });
  };

  return {
    render,
    setMusicas,
    setSocket,
    setClientes,
    toggleModal,
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
    socket: null,
    musicsPlayed: {},
  };

  let render = (socket) => {
    setHandlers();

    state.socket = socket;

    if (!state.music) elements.playPauseBtn.disabled = true;
  };

  let setActiveMusic = (music, restart = false) => {
    if (state.music && state?.music?.nome == music.nome && !restart) return;

    state.music = music;

    state.chunksLoaded = 0;

    if (state.isPlaying) {
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

    console.log(state);

    if (state.musicsPlayed.hasOwnProperty(music.path)) {
      if (state.musicsPlayed[music.path].chunksLoaded != 0) {
        for (let i = 0; i < state.musicsPlayed[music.path].chunksLoaded; i++) {
          const chunk = state.musicsPlayed[music.path].chunks[i];

          wav.fromScratch(2, state.music["framerate"] * 1, "16", chunk);

          const buff = wav.toBuffer().buffer;

          state.context.decodeAudioData(
            buff,
            (sourceBuffer) => {
              var soundSource = state.context.createBufferSource();
              soundSource.buffer = sourceBuffer;
              soundSource.connect(state.context.destination);
              soundSource.start(0 + 30 * i);
              soundSource.addEventListener("ended", () => {
                console.log(state.context.currentTime);
                if (state.music["duracao"] * 1 <= state.context.currentTime) {
                  state.context.suspend();
                  state.isPlaying = false;
                  elements.playPauseImg.src =
                    "assets/play-button-svgrepo-com.svg";
                  setActiveMusic(state.music, true);
                }
              });
              if (!state.isPlaying) state.context.suspend();
            },
            (e) => {
              console.log(e);
            }
          );
        }
        state.chunksLoaded = state.musicsPlayed[music.path].chunksLoaded;
      }
    } else {
      state.musicsPlayed[music.path] = {
        chunks: [],
        chunksLoaded: 0,
      };
    }

    state.context.currentTime = 0;

    state.context.onstatechange = (e) => {
      console.log(state.context.state);
    };

    handlePlayPause();
  };

  let onMessageCallback = (msg) => {
    const message = msg.data;
    const chunk = new Int16Array(message);
    console.log(chunk);

    const caminhoDaMusica = state.music["path"];

    console.log(state.musicsPlayed[caminhoDaMusica]);
    state.musicsPlayed[caminhoDaMusica] = {
      chunks: [...state.musicsPlayed[caminhoDaMusica].chunks, chunk],
      chunksLoaded: state.musicsPlayed[caminhoDaMusica].chunksLoaded + 1,
    };

    wav.fromScratch(2, state.music["framerate"] * 1, "16", chunk);

    const buff = wav.toBuffer().buffer;

    state.context.decodeAudioData(
      buff,
      (sourceBuffer) => {
        var soundSource = state.context.createBufferSource();
        soundSource.buffer = sourceBuffer;
        soundSource.connect(state.context.destination);
        soundSource.start(0 + 30 * state.chunksLoaded);
        soundSource.addEventListener("ended", () => {
          console.log(state.context.currentTime);
          if (state.music["duracao"] * 1 <= state.context.currentTime) {
            state.context.suspend();
            state.isPlaying = false;
            elements.playPauseImg.src = "assets/play-button-svgrepo-com.svg";
            setActiveMusic(state.music, true);
          }
        });
        state.chunksLoaded++;
        if (!state.isPlaying) state.context.suspend();
      },
      (e) => {
        console.log(e);
      }
    );
  };

  let setHandlers = () => {
    elements.playPauseBtn.addEventListener("click", () => {
      handlePlayPause();
    });
  };

  let handlePlayPause = () => {
    const sock = state.socket;
    if (state.isPlaying) {
      state.isPlaying = false;
      elements.playPauseImg.src = "assets/play-button-svgrepo-com.svg";

      if (state.context) state.context.suspend();

      clearInterval(state.interval);

      state.interval = null;
    } else {
      console.log(state.chunksLoaded);

      request =
        "manda musica " + state.music["path"] + " " + state.chunksLoaded;

      state.isPlaying = true;

      elements.playPauseImg.src = "assets/pause-circle-svgrepo-com.svg";

      if (state.context) state.context.resume();

      if ((state.chunksLoaded + 1) * 30 >= state.music["duracao"] * 1) {
        console.log("nao precisa mais pedir");
        return;
      }

      if (state.chunksLoaded == 0) sock.send(request);

      state.interval = setInterval(() => {
        request =
          "manda musica " + state.music["path"] + " " + state.chunksLoaded;
        console.log(request);
        sock.send(request);

        if ((state.chunksLoaded + 1) * 30 >= state.music["duracao"] * 1) {
          console.log("nao precisa mais pedir");
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

  let elements = {
    modalBtn: document.querySelector(".clientes"),
  };

  let state = {
    socket: null,
    musicList: null,
  };

  let handleMusicList = (list) => {
    if (typeof list[0] == "string") {
      components.modal.setClientes(list);
    } else {
      components.cardList.setMusicList(list, components.player.setActiveMusic);
      components.modal.setMusicas(list);
      state.musicList = list;
    }
  };

  let handlePlayRequest = (musicPath) => {
    let music = state.musicList?.find((music) => music.path == musicPath);

    components.player.setActiveMusic(music);
  };

  let render = () => {
    state.socket = socketConnect(
      components.player.onMessageCallback,
      handleMusicList,
      handlePlayRequest
    );
    components.player.render(state.socket);
    components.modal.setSocket(state.socket);
    components.modal.render();

    elements.modalBtn.addEventListener("click", components.modal.toggleModal);
  };

  return {
    render,
  };
};

const socketConnect = (handleMusic, handleList, handlePlayRequest) => {
  const ip = window.prompt("qual o ip do servidor local?");
  const sock = new WebSocket(`ws://${ip}:8000`);
  window.sock = sock;

  sock.binaryType = "arraybuffer";

  sock.onopen = () => {
    console.log("Websocket conectado");
    sock.send("manda lista");
    sock.send(meu_nome);
  };

  sock.onmessage = async (msg) => {
    console.log(msg);
    if (msg.data instanceof ArrayBuffer) {
      handleMusic(msg);
    } else {
      try {
        if (msg.data?.search("play") == -1) {
          let data = JSON.parse(msg.data);
          console.log(data);
          handleList(data);
        } else {
          handlePlayRequest(msg.data.split(" ")[1]);
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  sock.onerror = (error) => console.log("Websocket error", error);

  sock.onclose = () => {
    console.log("Disconected from the Websocket Server");
  };

  return sock;
};

meu_nome = "meu nome ";
meu_nome += window.prompt("Qual seu nome?");

page().render();
