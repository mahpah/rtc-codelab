let serverless = null
let alice
let bob
let mirror = document.querySelector('#mirror')
let screen = document.querySelector('#screen')
let localStream
let initted

const init = () => {
	navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false,
	}).then(stream => {
		initted = true
		mirror.srcObject = stream
		localStream = stream
	})
}

const call = () => {
	if (!initted) {
		return
	}

	alice = new RTCPeerConnection(serverless)

	alice.onicecandidate = (event) => {
		bob.addIceCandidate(new RTCIceCandidate(event.candidate))
	}

	bob = new RTCPeerConnection(serverless)
	bob.onicecandidate = () => {
		alice.addIceCandidate(new RTCIceCandidate(event.candidate))
	}

	bob.onaddstream = (event) => {
		screen.srcObject = event.stream
	}

	alice.addStream(localStream)
	alice.createOffer({
		offerToReceiveVideo: 1,
		offerToReceiveAudio: 1,
	}).then((offerDesc) => {
		alice.setLocalDescription(offerDesc)
		return bob.setRemoteDescription(offerDesc)
	}).then(() => {
		return bob.createAnswer()
	}).then(answerDesc => {
		bob.setLocalDescription(answerDesc)
		alice.setRemoteDescription(answerDesc)
	})
}

const hang = () => {
	alice.close()
	bob.close()
}

document.querySelector('#btn-call').addEventListener('click', call)
document.querySelector('#btn-hang').addEventListener('click', hang)
init()
