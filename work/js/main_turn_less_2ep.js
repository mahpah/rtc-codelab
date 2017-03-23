/* global io */
let isInitiator
let isConnected = false
const RoomName = 'foo'
const screen = document.querySelector('#screen')
const mirror = document.querySelector('#mirror')

const socket = io.connect()

const listenSocket = () => {
  socket.on('created', function(room, clientId) {
    isInitiator = true
    isConnected = true
  })
  socket.on('joined', function(room, clientId) {
    isConnected = true
    isInitiator = false
  })
  socket.on('full', function(room) {
    isConnected = false
    console.log('Message from client: Room ' + room + ' is full :^(')
  })
  socket.on('ready', function(id) {
    console.log('Message from client: joint id ', id)
  })
  socket.on('log', function(array) {
    console.log.apply(console, array)
  })

  socket.on('message', m => {
    console.log('some client emit: ', m)
  })
}

const sendMessage = (m) => {
  // socket.emit('message', {
  //   room: RoomName,
  //   message: m,
  // })
  socket.emit('message', m)
}

const joinSocket = () => {
  socket.emit('create or join', RoomName)
  console.log('Message from client: Asking to join room ' + RoomName)
}

const requestUserStreamAndAttachTo = (me) => {
  const mediaContraints = {
    video: true,
    audio: false,
  }
  return navigator.mediaDevices.getUserMedia(mediaContraints)
    .then(stream => {
      mirror.srcObject = stream
      me.addStream(stream)
    })
    .catch(e => {
      console.log(e)
    })
}

const connect = () => {
  const me = createConnection()

  socket.on('message', data => {
    switch (data.type) {
      case 'offer':
        me.setRemoteDescription(data)
        answer(me)
        return
      case 'answer':
        me.setRemoteDescription(data)
        return
      case 'candidate':
        me.addIceCandidate(new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate,
        }))
        return
      default:
        return
    }
  })
  requestUserStreamAndAttachTo(me)
  return me
}

const createConnection = () => {
  // TODO: need try catch
  const serverless = null
  let me = new RTCPeerConnection(serverless)

  me.onicecandidate = (event) => {
    if (event.candidate) {
      // me.addIceCandidate(event.candidate)
      sendMessage({
        type: 'candidate',
        candidate: event.candidate.candidate,
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
      })
    }
  }
  me.onaddstream = (event) => {
    // pipe to video elem
    screen.srcObject = event.stream
  }
  me.onremovestream = () => {

  }
  return me
}

const call = (me) => {
  const offerConstraints = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 0,
  }
  return me.createOffer(offerConstraints)
    .then(description => {
      me.setLocalDescription(description)
      sendMessage(description)
    })
}

const answer = me => {
  me.createAnswer()
    .then(description => {
      me.setLocalDescription(description)
      sendMessage(description)
    })
}

listenSocket()
joinSocket()
let me = connect()
document.querySelector('#call').addEventListener('click', () => call(me))

window.sendMessage = sendMessage
