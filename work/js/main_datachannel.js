let localConnection
let remoteConnection
let serverless = null
let sendChannel
const sendChannelName = 'sendChannel'
let receiveChannel
const dataContraints = null
let text = document.querySelector('textarea')
let screen = document.querySelector('#screen')
let connected

const startConnection = () => {
	localConnection = new RTCPeerConnection(serverless)
	localConnection.onicecandidate = (event) => {
		if (event.candidate) {
			remoteConnection.addIceCandidate(event.candidate)
		}
	}

	remoteConnection = new RTCPeerConnection(serverless)
	remoteConnection.onicecandidate = (event) => {
		if (event.candidate) {
			localConnection.addIceCandidate(event.candidate)
		}
	}
	remoteConnection.ondatachannel = (event) => {
		receiveChannel = event.channel
		receiveChannel.onmessage = event => {
			console.log(event)
			screen.innerHTML = event.data
		}
	}

	sendChannel = localConnection.createDataChannel(sendChannelName, dataContraints)
	localConnection.createOffer()
		.then(descriptor => {
			localConnection.setLocalDescription(descriptor)
			remoteConnection.setRemoteDescription(descriptor)
			return remoteConnection.createAnswer()
		})
		.then(descriptor => {
			localConnection.setRemoteDescription(descriptor)
			remoteConnection.setLocalDescription(descriptor)
			connected = true
		})
}

const sendMessage = (mess) => {
	sendChannel.send(mess)
}

document.querySelector('#btn-connect').addEventListener('click', startConnection)
document.querySelector('#btn-send').addEventListener('click', () => {
	if (!connected) {
		return
	}
	sendMessage(text.value)
	text.value = ''
})
