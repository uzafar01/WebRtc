
// ......................................................
// ..................RTCMultiConnection Code.............
// ......................................................
var connection = new RTCMultiConnection();
// by default, socket.io server is assumed to be deployed on your own URL
//connection.socketURL = '/';
// comment-out below line if you do not have your own socket.io server
connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
connection.socketMessageEvent = 'video-conference-demo';
connection.session = {
    audio: true,
    video: true
};
connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};
// https://www.rtcmulticonnection.org/docs/iceServers/
// use your own TURN-server here!
connection.iceServers = [{
    'urls': [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun.l.google.com:19302?transport=udp',
    ]
}];
connection.videosContainer = document.getElementById('local-video-container');
connection.onstream = function (event) {
    var existing = document.getElementById(event.streamid);
    if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
    }
    event.mediaElement.removeAttribute('src');
    event.mediaElement.removeAttribute('srcObject');
    event.mediaElement.muted = true;
    event.mediaElement.volume = 0;
    if (event.type === 'local') {
        var video = getVideo(event, event.extra);
        document.getElementById('local-video-container').appendChild(video);

    }
    if (event.type === 'remote') {
        var video = getVideo(event, event.extra);
        var remoteVideosContainer = document.getElementById('remote-videos-container');
        remoteVideosContainer.appendChild(video, remoteVideosContainer.firstChild);
    }

    event.mediaElement.width = innerWidth / 3.4;

    event.mediaElement.width = 600;

    rotateVideo(event.mediaElement);
    scaleVideos();

    // to keep room-id in cache
    localStorage.setItem(connection.socketMessageEvent, connection.sessionid);
    chkRecordConference.parentNode.style.display = 'none';
    if (chkRecordConference.checked === true) {
        btnStopRecording.style.display = 'inline-block';
        recordingStatus.style.display = 'inline-block';
        var recorder = connection.recorder;
        if (!recorder) {
            recorder = RecordRTC([event.stream], {
                type: 'video'
            });
            recorder.startRecording();
            connection.recorder = recorder;
        }
        else {
            recorder.getInternalRecorder().addStreams([event.stream]);
        }
        if (!connection.recorder.streams) {
            connection.recorder.streams = [];
        }
        connection.recorder.streams.push(event.stream);
        recordingStatus.innerHTML = 'Recording ' + connection.recorder.streams.length + ' streams';
    }
    if (event.type === 'local') {
        connection.socket.on('disconnect', function () {
            if (!connection.getAllParticipants().length) {
                location.reload();
            }
        });
    }
};
var recordingStatus = document.getElementById('recording-status');
var chkRecordConference = document.getElementById('record-entire-conference');
var btnStopRecording = document.getElementById('btn-stop-recording');
btnStopRecording.onclick = function () {
    var recorder = connection.recorder;
    if (!recorder) return alert('No recorder found.');
    recorder.stopRecording(function () {
        var blob = recorder.getBlob();
        invokeSaveAsDialog(blob);
        connection.recorder = null;
        btnStopRecording.style.display = 'none';
        recordingStatus.style.display = 'none';
        chkRecordConference.parentNode.style.display = 'inline-block';
    });
};

connection.onstreamended = function (e) {

    e.mediaElement.style.opacity = 0;
    rotateVideo(e.mediaElement);
    setTimeout(function () {
        if (e.mediaElement && e.mediaElement.parentNode && e.mediaElement.parentNode.parentNode) {
            e.mediaElement.parentNode.parentNode.removeChild(e.mediaElement.parentNode);
        }
        scaleVideos();
    }, 1000);

}

connection.onNewParticipant = function (participantId, userPreferences) {
   
    // if OfferToReceiveAudio/OfferToReceiveVideo should be enabled for specific users
    if (confirm(participantId + ' would like to join conference. Do you want to allow?')) {
        connection.acceptParticipationRequest(participantId, userPreferences);
    }
    else {
        connection.disconnectWith(participantId);
        return;
}
    
};

// check if user is ejected
connection.onSessionClosed = function (event) {   

    if (event.isEjected) {
        alert('Your session has been terminated by ' + event.extra.username);
    }
    else {
        DeleteConferenceFromDb(connection.sessionid);
    }

    SwitchTabOnCloseConference();

};
connection.onMediaError = function (e) {
    if (e.message === 'Concurrent mic process limit.') {
        if (DetectRTC.audioInputDevices.length <= 1) {
            alert('Please select external microphone. ');
            return;
        }
        var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
        connection.mediaConstraints.audio = {
            deviceId: secondaryMic
        };
        connection.join(connection.sessionid);
    }
};


function rotateVideo(mediaElement) {
    mediaElement.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(0deg)';
    setTimeout(function () {
        mediaElement.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(360deg)';
    }, 1000);
}

function scaleVideos() {
    var videos = document.querySelectorAll('video'),
        length = videos.length,
        video;
    var minus = 130;
    var windowHeight = 700;
    var windowWidth = 600;
    var windowAspectRatio = windowWidth / windowHeight;
    var videoAspectRatio = 4 / 3;
    var blockAspectRatio;
    var tempVideoWidth = 0;
    var maxVideoWidth = 0;
    for (var i = length; i > 0; i--) {
        blockAspectRatio = i * videoAspectRatio / Math.ceil(length / i);
        if (blockAspectRatio <= windowAspectRatio) {
            tempVideoWidth = videoAspectRatio * windowHeight / Math.ceil(length / i);
        } else {
            tempVideoWidth = windowWidth / i;
        }
        if (tempVideoWidth > maxVideoWidth)
            maxVideoWidth = tempVideoWidth;
    }
    for (var i = 0; i < length; i++) {
        video = videos[i];
        if (video)
            video.width = maxVideoWidth - minus;
    }
}
window.onresize = scaleVideos;

// ......................................................
// ......................Handling Room-ID................
// ......................................................
function showRoomURL(roomid) {
    var roomHashURL = '#' + roomid;
    var roomQueryStringURL = '?roomid=' + roomid;
    var html = '<h2>Unique URL for your room:</h2><br>';
    html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
    html += '<br>';
    html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';
    var roomURLsDiv = document.getElementById('room-urls');
    roomURLsDiv.innerHTML = html;
    roomURLsDiv.style.display = 'block';
}
(function () {
    var params = {},
        r = /([^&=]+)=?([^&]*)/g;
    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }
    var match, search = window.location.search;
    while (match = r.exec(search.substring(1)))
        params[d(match[1])] = d(match[2]);
    window.params = params;
})();
var roomid = '';
function SetRoomId() {
    if (localStorage.getItem(connection.socketMessageEvent)) {
        roomid = localStorage.getItem(connection.socketMessageEvent);
    } else {
        roomid = $('#Title').val();
        localStorage.setItem(connection.socketMessageEvent, roomid);
    }

    var hashString = location.hash.replace('#', '');
    if (hashString.length && hashString.indexOf('comment-') == 0) {
        hashString = '';
    }
    var roomid = params.roomid;
    if (!roomid && hashString.length) {
        roomid = hashString;
    }
}
if (roomid && roomid.length) {
    document.getElementById('room-id').value = roomid;
    localStorage.setItem(connection.socketMessageEvent, roomid);
    // auto-join-room
    (function reCheckRoomPresence() {
        connection.checkPresence(roomid, function (isRoomExist) {
            if (isRoomExist) {
                connection.join(roomid);
                return;
            }
            setTimeout(reCheckRoomPresence, 5000);
        });
    })();

}
// detect 2G
if (navigator.connection &&
   navigator.connection.type === 'cellular' &&
   navigator.connection.downlinkMax <= 0.115) {
    alert('2G is not supported. Please use a better internet service.');
}
function getVideo(stream, extra) {
   
    var div = document.createElement('div');
    div.className = 'video-container';
    div.id = stream.userid || 'self';
    var h2 = document.createElement('h2');
    if (stream.type === 'remote') {
        if (connection.isInitiator) {
            var eject = document.createElement('button');
            eject.className = 'eject';
            eject.title = 'Eject this User';
            eject.onclick = function () {
                // eject a specific user   
                connection.getAllParticipants().forEach(function (pid) {
                    if ($(this).parent().parent().attr('id') == pid) {
                        var peer = connection.peers[pid].peer;
                                              
                        peer.removeStream(streamToRemove);
                        connection.deletePeer(pid);
                        connection.renegotiate();
                    }
                });
               
                this.parentNode.style.display = 'none';
            };
            div.appendChild(eject);
            
        }
        h2.innerHTML = stream.extra.username;
        
    }
    if (stream.type === 'local') {
        var leave = document.createElement('button');
        leave.className = 'eject';
        leave.title = connection.isInitiator ? 'Close conference' : 'Leave conference';
        leave.onclick = function () {
           
            // disconnect with all users
            connection.getAllParticipants().forEach(function (pid) {
                connection.disconnectWith(pid);
            });

            // stop all local cameras
            connection.attachStreams.forEach(function (localStream) {
                localStream.stop();
            });

            // close socket.io connection
            connection.closeSocket();

            //switch tabs
            SwitchTabOnCloseConference();

            this.parentNode.style.display = 'none';
        };
        div.appendChild(leave);
        h2.innerHTML = "Me";
        
    }    

    div.appendChild(stream.mediaElement);   
    div.appendChild(h2);

    return div;
}
connection.maxParticipantsAllowed = 4; // one-to-one
connection.onRoomFull = function (roomid) {
    alert('Room is full.');
};

connection.onUserIdAlreadyTaken = function (useridAlreadyTaken, yourNewUserId) {
    if (connection.enableLogs) {
        console.warn('Userid already taken.', useridAlreadyTaken, 'Your new userid:', yourNewUserId);
    }

    connection.join(useridAlreadyTaken);
};
// ......................................................
// .......................UI Code........................
// ......................................................

function JoinButtonClick(sessionid,urlCode) {

    $("#joinModalOkBtn").click(function () {
        
        if (!$('#joinNameText').val()) {
             $('#joinNameTextVal').text('Please provide name.');
        }
        else {           
            
            connection.join(sessionid, function (isJoinedRoom, roomid, error) {
                
                if (error) {                    
                    if (error === 'Room not available') {
                        alert('This room does not exist. Please either create it or wait for moderator to enter in the room.');
                        return;
                    }
                    alert(error);
                }                
                else
                {
                    connection.extra = {
                        username: $('#joinNameText').val()
                    }
                    this.disabled = true;
                    $('#conferenceDetail').hide();
                    $('#videoContainer').show();
                    $('#joinConferenceModal').modal('toggle');
                    activateTab(activateTab, 'quickconference')
                }
            });            
           
        }
    });
      
}

var roomsList = document.getElementById('rooms-list');
function SetupNewConference() {          

    var url = $("#createConference").val();

  //  location.href = location.href.split('#')[0] + '#' + connection.extra.urlcode;
  //  $('#UrlCode').val(location.href.split('#')[1]);
   
    $.ajax({
        type: "POST",
        url: url,
        data:  $('#__AjaxAntiForgeryForm').serialize(),
        datatype: "json",
        success: function (data) {
            
            //connection.interval = 1000;              
           
            connection.extra = {
                username: $('#SessionId').val(),               
            } 
                      
            $('#conferenceDetail').hide();
            $('#videoContainer').show();
            connection.open($('#Title').val(), function (isRoomOpened, roomid, error) {

                if (isRoomOpened === true) {                   
                    SetRoomId();
                    
                    showRoomURL(connection.sessionid);
                }
                else {
                  

                    if (error === 'Room not available') {
                        alert('Someone already created this room. Please either join or create a separate room.');
                        return;
                    }
                    alert(error);
                }
            });          
           
        },
        error: function () {
            $('#conferenceDetail').show();
            $('#videoContainer').hide();
        }
    });
};

function GetAllConference() {
    
    $.ajax({
        type: "GET",
        url: "/Home/GetAllConferences/",
        datatype: "json",
        success: function (data) {

            $('#allConferenceDiv').html('');
            $('#allConferenceDiv').html(data);

        },
        error: function () {

        }
    });
}

function DeleteConferenceFromDb(sessionid) {

    var url = $("#deleteConference").val();

    $.ajax({
        type: "POST",
        url: url,
        data: { sessionId: sessionid },
     
        success: function (data) {
            return true;
        },
        error: function () {
            return false;            
        }
    });

}

function SwitchTabOnCloseConference() {
    $('#conferenceDetail').show();
    $('#videoContainer').hide();
    activateTab(activateTab, 'all');
}

// ......................................................
// ......................Handling Room-ID................
// ......................................................
function showRoomURL(roomid) {
    var roomHashURL = '#' + roomid;
    var roomQueryStringURL = window.location.origin + '?roomid=' + roomid;
    var html = '<h2>Unique URL for your room:</h2><br>';    
   
    html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';
    var roomURLsDiv = document.getElementById('room-urls');
    roomURLsDiv.innerHTML = html;
    roomURLsDiv.style.display = 'block';
}
(function () {
    var params = {},
        r = /([^&=]+)=?([^&]*)/g;
    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }
    var match, search = window.location.search;
    while (match = r.exec(search.substring(1)))
        params[d(match[1])] = d(match[2]);
    window.params = params;    
})();

// detect 2G
if (navigator.connection &&
   navigator.connection.type === 'cellular' &&
   navigator.connection.downlinkMax <= 0.115) {
    alert('2G is not supported. Please use a better internet service.');
}

var hashString = location.hash.replace('#', '');
function SetRoomId()
{    
    if (localStorage.getItem(connection.socketMessageEvent)) {
        roomid = localStorage.getItem(connection.socketMessageEvent);
    } else {
        roomid = $('#Title').val();
        localStorage.setItem(connection.socketMessageEvent, roomid);
    }
   
    
    if (hashString.length && hashString.indexOf('comment-') == 0) {
        hashString = '';
    }
    var roomid = params.roomid;
    if (!roomid && hashString.length) {
        roomid = hashString;
    }
}

 var roomid = params.roomid;
    if (!roomid && hashString.length) {
        roomid = hashString;
    }
    if (roomid && roomid.length) {
       
        $('#joinConferenceModal').modal('show');
        $("#joinModalOkBtn").click(function () {
            if (!$('#joinNameText').val()) {
                $('#joinNameTextVal').text('Please provide name.');
            }
            else {

                // document.getElementById('Title').value = roomid;
                localStorage.setItem(connection.socketMessageEvent, roomid);
                // auto-join-room
                (function reCheckRoomPresence() {
                    connection.checkPresence(roomid, function (isRoomExist) {
                        if (isRoomExist) {
                            connection.join(roomid, function (isJoinedRoom, roomid, error) {
                                if (error) {
                                    if (error === 'Room not available') {
                                        alert('This room does not exist. Please either create it or wait for moderator to enter in the room.');
                                        return;
                                    }
                                    alert(error);
                                }
                                else {
                                    connection.extra = {
                                    username: $('#joinNameText').val()
                                }
                                    this.disabled = true;
                                    $('#conferenceDetail').hide();
                                    $('#videoContainer').show();
                                    $('#joinConferenceModal').modal('toggle');
                                    activateTab(activateTab, 'quickconference');
                                }
                            });
                           
                            return;
                        }
                        else {
                            alert('This room does not exist.');
                            return;
                        }
                        //setTimeout(reCheckRoomPresence, 5000);
                    });
                })();
            }
        });
       
    }

