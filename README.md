# datePicker
a simple datePicker
一个简单的datePicker Demo
# 什么是webRTC
目前，两个客户端想要通信一般是需要通过一个服务器作为消息的中转，以实时聊天为例，目前的方法主要有长连接、轮训和websocket
等方式，但是无论这几种方式中的哪种，都是client A ——> Server ——> client B 这种模式，首先客户端将消息发送给服务器，服务器接收到消息再推送给
客户端B，或者客户端B主动从服务器拉取消息。
而webRTC（real-time-communication)则使两个客户端之间直接通信成为可能，支持浏览器之间的点对点传输（peer-to-peer），目前各浏览器对webrtc的支持如下：
# 如何使用
## 获取视频音频流
```
    navigator.getUserMedia(constraints, successCallback, errorCallback);
```
其中，constraints是音视频的约束对象，可以设定视频的宽高等，successCallback为获取成功的回调函数，errorCallback为获取失败的回调函数
当获取成功后可以获取到从用户设备的摄像头获取到的音视频流，可以通过html5的video标签将获取到的媒体流播放出来
```
var hdConstraints = {
    video: {
        mandatory: {
            minWidth: 1280,
            minHeight: 720
        }
    }
};

var vgaConstraints = {
    video: {
        mandatory: {
            maxWidth: 640,
            maxHeight: 360
        }
    }
};
function successCallback(localMediaStream) {
    video.src = window.URL.createObjectURL(localMediaStream);
}
```
注意，video标签要设置autoplay属性，才会自动播放。
### 浏览器兼容性
目前getUserMedia还没有标准的实现，在使用时需要加上特定前缀。
```
    var getUserMedia = (navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia);
```
### demo

到这里为止，我们已经可以获取到本地的媒体流，接下来需要将媒体流传输给远端客户端（romote peer）
webrtc中有个对象为RTCPeerConnection，用于创建点到点的连接。这个对象提供一些方法来完成客户端的识别、数据的传输等功能。
```
createOffer()
createAnswer()
setRemoteDescription()
setLocalDescription()
```
#### 两个客户端通信流程
设两个客户端分别为c1和c2,那么，若c1和c2通信，需要经过以下几个步骤
c1发送offer信令，生成sdp描述并发送给c2，并设置本地sdp描述
c2接收offer信令，并通过接收到的sdp设置远端sdp描述
c2发送answer信令，生成sdp描述并发送给c1，并设置本地sdp描述
c1接收answer信令，并通过接收到的sdp描述设置远端sdp描述

#### 名词解释
sdp (Session Description Protocol)
```
v=0
o=- 3883943731 1 IN IP4 127.0.0.1
s=
t=0 0
a=group:BUNDLE audio video
m=audio 1 RTP/SAVPF 103 104 0 8 106 105 13 126

// ...

a=ssrc:2223794119 label:H4fjnMzxy3dPIgQ7HxuCTLb4wLLLeRHnFxh810
```

通过代码来描述应该如下：
```
c1.createOffer().then(function(offer) {
    return c1.setLocalDescription(offer);
})
.then(function() {
    sendToServer({
        name: myUsername,
        target: targetUsername,
        type: "video-offer",
        sdp: c1.localDescription
    });
})
.catch(function(reason) {
    // An error occurred, so handle the failure to connect
});
c2.createAnswer().then(function(answer) {
    return c2.setLocalDescription(answer);
})
.then(function() {
    // Send the answer to the remote peer through the signaling server.
})
.catch(handleGetUserMediaError);
```
demo


问题：

服务器
NAT

webRTC使用RTCPeerConnection来在两个浏览器之间传递流数据，但是在进行数据传递之前首先要进行信令传输，告诉对方本机的相关信息：
包括网络信息，如ip和端口，及媒体信息，包括可接受的媒体类型等内容。这一过程还是需要服务器来协助完成，用于建立两个客户端之间的webrtc信道。
信令传输可以使用任意方式，比如websocket。
信令交换必须在建立点对点数据传输之前完成。
例如，client A和clientB想要进行通信，他们都需要完成以下几步。
```
var signalingChannel = new SignalingChannel();
var configuration = { "iceServers": [{ "urls": "stuns:stun.example.org" }] };
var pc;

// call start() to initiate
function start() {
    pc = new RTCPeerConnection(configuration);

    // send any ice candidates to the other peer
    pc.onicecandidate = function (evt) {
        signalingChannel.send(JSON.stringify({ "candidate": evt.candidate }));
    };

    // let the "negotiationneeded" event trigger offer generation
    pc.onnegotiationneeded = function () {
        pc.createOffer().then(function (offer) {
            return pc.setLocalDescription(offer);
        })
        .then(function () {
            // send the offer to the other peer
            signalingChannel.send(JSON.stringify({ "desc": pc.localDescription }));
        })
        .catch(logError);
    };

    // once remote video track arrives, show it in the remote video element
    pc.ontrack = function (evt) {
        if (evt.track.kind === "video")
          remoteView.srcObject = evt.streams[0];
    };

    // get a local stream, show it in a self-view and add it to be sent
    navigator.mediaDevices.getUserMedia({ "audio": true, "video": true })
        .then(function (stream) {
            selfView.srcObject = stream;
            pc.addTrack(stream.getAudioTracks()[0], stream);
            pc.addTrack(stream.getVideoTracks()[0], stream);
        })
        .catch(logError);
}

signalingChannel.onmessage = function (evt) {
    if (!pc)
        start();

    var message = JSON.parse(evt.data);
    if (message.desc) {
        var desc = message.desc;

        // if we get an offer, we need to reply with an answer
        if (desc.type == "offer") {
            pc.setRemoteDescription(desc).then(function () {
                return pc.createAnswer();
            })
            .then(function (answer) {
                return pc.setLocalDescription(answer);
            })
            .then(function () {
                var str = JSON.stringify({ "desc": pc.localDescription });
                signalingChannel.send(str);
            })
            .catch(logError);
        } else if (desc.type == "answer") {
            pc.setRemoteDescription(desc).catch(logError);
        } else {
            log("Unsupported SDP type. Your code may differ here.");
        }
    } else
        pc.addIceCandidate(message.candidate).catch(logError);
};

function logError(error) {
    log(error.name + ": " + error.message);
}
```

## 信令交换
createOffer
createAnswer

## 网络
两个浏览器想要直接通信，首先需要获取到对方的ip地址和端口等网络信息。由于很多计算机处于内网或者防火墙中，
peer-to-peer通信涉及到NAT技术。在webrtc中我们可以采用ice框架来解决这个问题。

STUN（Simple Traversalof UDP Through Network）：这种方式即是类似于我们上面举例中服务器C的处理方式。也是目前普遍采用的方式。但具体实现要比我们描述的复杂许多，光是做网关Nat类型判断就由许多工作，RFC3489中详细描述了。
TURN(Traveral Using Relay NAT)：该方式是将所有的数据交换都经由服务器来完成，这样NAT将没有障碍，但服务器的负载、丢包、延迟性就是很大的问题。目前很多游戏均采用该方式避开NAT的问题。这种方式不叫p2p。
ICE(Interactive Connectivity Establishment)：是对上述各种技术的综合，但明显带来了复杂性。

## RTCPeerConnection
createOffer
createAnswer
setLocalDescription
setRemoteDescription
onicecandidate
addStream

## 数据传输

# 基于webRTC的网站
talky.io

# 参考资料
[https://www.html5rocks.com/en/tutorials/webrtc/basics/](https://www.html5rocks.com/en/tutorials/webrtc/basics/)
[https://segmentfault.com/a/1190000000436544](https://segmentfault.com/a/1190000000436544)
[https://segmentfault.com/a/1190000000439103](https://segmentfault.com/a/1190000000439103)
[https://segmentfault.com/a/1190000000436544](https://segmentfault.com/a/1190000000436544)
[https://bitbucket.org/webrtc/codelab](https://bitbucket.org/webrtc/codelab)
[https://www.w3.org/TR/webrtc/](https://www.w3.org/TR/webrtc/)
[https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
