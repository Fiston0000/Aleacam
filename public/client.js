const socket = io();

// === ÉLÉMENTS DOM ===
const localVideoContainer = document.getElementById("local-video-container");
const remoteVideoContainer = document.getElementById("remote-video-container");
const messagesList = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const descBtn = document.getElementById("desc-btn");
const descInput = document.getElementById("description-input");
const localDesc = document.getElementById("local-description");
const remoteDesc = document.getElementById("remote-description");
const camSelect = document.getElementById("cam-select");
const micSelect = document.getElementById("mic-select");
const skipBtn = document.getElementById("skip-btn");
const stopBtn = document.getElementById("stop-btn");
const playBtn = document.getElementById("play-btn");

let localStream;
let localVideo;
let remoteVideo;

// ===============================
// 🎥 INITIALISATION CAMERA/MICRO
// ===============================
async function initMedia() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    camSelect.innerHTML = "";
    micSelect.innerHTML = "";

    devices.forEach(device => {
      const option = document.createElement("option");
      option.value = device.deviceId;

      if (device.kind === "videoinput") {
        option.text = device.label || `Caméra ${camSelect.length + 1}`;
        camSelect.appendChild(option);
      } else if (device.kind === "audioinput") {
        option.text = device.label || `Micro ${micSelect.length + 1}`;
        micSelect.appendChild(option);
      }
    });

    await startStream();
  } catch (err) {
    console.error("Erreur caméra/micro :", err);
  }
}

async function startStream() {
  const videoSource = camSelect.value;
  const audioSource = micSelect.value;

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: videoSource ? { exact: videoSource } : undefined },
      audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    });

    if (!localVideo || !localVideoContainer.contains(localVideo)) {
      localVideo = document.createElement("video");
      localVideo.autoplay = true;
      localVideo.muted = true;
      localVideo.id = "myVideo"; // effet miroir via CSS
      localVideoContainer.innerHTML = "";
      localVideoContainer.appendChild(localVideo);
    }

    localVideo.srcObject = localStream;
  } catch (err) {
    console.error("Impossible d’accéder à la caméra/micro :", err);
    localVideoContainer.innerHTML = "<p>Caméra arrêtée</p>";
  }
}

// ===============================
// 💬 CHAT
// ===============================
function sendMessage() {
  const msg = messageInput.value.trim();
  if (msg) {
    socket.emit("message", msg);
    addMessage("Vous", msg);
    messageInput.value = "";
  }
}

function addMessage(user, msg) {
  const li = document.createElement("li");
  li.textContent = `${user} : ${msg}`;
  messagesList.appendChild(li);
  messagesList.scrollTop = messagesList.scrollHeight;
}

socket.on("message", (data) => {
  addMessage(data.user, data.msg);
});

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// ===============================
// 📝 DESCRIPTION
// ===============================
function updateDescription() {
  const desc = descInput.value.trim();
  const finalDesc = desc !== "" ? desc : "Pas de description";

  localDesc.textContent = finalDesc;
  socket.emit("description", finalDesc);
}

descBtn.addEventListener("click", updateDescription);
descInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    updateDescription();
  }
});

socket.on("description", (desc) => {
  remoteDesc.textContent = desc && desc.trim() !== "" ? desc : "Pas de description";
});

// ===============================
// 🔘 BOUTONS
// ===============================
skipBtn.addEventListener("click", () => {
  socket.emit("skip");
});

stopBtn.addEventListener("click", () => {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }
  localVideoContainer.innerHTML = "<p>Caméra arrêtée</p>";
});

playBtn.addEventListener("click", async () => {
  await startStream();
  socket.emit("play");
});

// ===============================
// 🎛️ Sélection caméra/micro
// ===============================
camSelect.addEventListener("change", startStream);
micSelect.addEventListener("change", startStream);

// ===============================
// 🔗 INIT
// ===============================
initMedia();
