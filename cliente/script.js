const list = [
  {
    nome: "Mc pipoka",
    length: "2:34",
  },
];

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
    sock.send("oi");

    const id = Math.round(Math.random() * 100);

    const data = JSON.stringify([
      {
        id,
        name: `[${id}] Erick Wendel`,
        address: {
          street: "my street",
          number: 20 * id,
        },
        profession: "developer",
      },
      {
        id,
        name: `[${id}] Jose da Silva`,
        address: {
          street: "my street",
          number: 20 * id,
        },
        profession: "developer",
      },
      {
        id,
        name: `[${id}] Mary Santos`,
        address: {
          street: "my street",
          number: 20 * id,
        },
        profession: "developer",
      },
    ]);

    console.log(data.length);

    sock.send("manda musica");
  };

  sock.onmessage = async (msg) => {
    const message = msg.data;
    console.log(typeof message);
    console.log("I got a message!", message);

    if (typeof message == "object") {
      const audio = new Audio();
      var reader = new FileReader();
      let newBlob = new Blob([message], { type: "audio/wav" });
      reader.readAsDataURL(newBlob);
      reader.onloadend = function (e) {
        audio.innerHTML = `<source src=${reader.result} type="audio/wav">`;
      };
      audio.controls = true;

      document.querySelector(".music-list").appendChild(audio);
    }
  };

  sock.onerror = (error) => console.log("Websocket error", error);

  sock.onclose = (e) => console.log("Disconected from the Websocket Server");
  //});

  return sock;
};

page().render();
