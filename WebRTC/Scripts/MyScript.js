
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

//connection.onNewParticipant = function (participantId, userPreferences) {
   
//    // if OfferToReceiveAudio/OfferToReceiveVideo should be enabled for specific users
//    if (confirm(participantId + ' would like to join conference. Do you want to allow?')) {
//            connection.acceptParticipationRequest(participantId, userPreferences);
//        }
//        else {
//            connection.disconnectWith(participantId);
//            return;
//        }  
    
//};

// check if user is ejected
//connection.onSessionClosed = function (event) {   
   
//    if (event.isEjected) {
//        alert('Your session has been terminated by ' + event.extra.username);
//    }
//    else {
//        if (connection.getAllParticipants().length == 0)
//            DeleteConferenceFromDb(connection.extra.id);
//    }

//    SwitchTabOnCloseConference();

//};

connection.onleave = function (event) {
   // alert(event.extra.username + ' left.');
    if (connection.getAllParticipants().length == 0 && connection.isInitiator && connection.userid == event.userid)
        DeleteConferenceFromDb(connection.extra.id);
};

connection.onclose = function (event) {   
    //alert('onclose ' + connection.getAllParticipants().length);
    //if (connection.getAllParticipants().length == 0 )
    //    DeleteConferenceFromDb(connection.extra.id);
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


function getVideo(stream, extra) {
   
    var div = document.createElement('div');
    div.className = 'video-container';
    div.id = stream.userid || 'self';
    div.title = stream.extra.username ? stream.extra.username : 'Me';
    var h2 = document.createElement('h2');
    h2.innerHTML = stream.extra.username ? stream.extra.username : 'Me';
    if (stream.type === 'remote') {
        if (connection.isInitiator) {
            var eject = document.createElement('button');
            eject.className = 'eject';
            eject.title = 'Eject this User';
            eject.onclick = function () {
                // eject a specific user  
                connection.send({
                    userRemoved: true,
                    removedUserId: stream.userid
                });
               
                this.parentNode.style.display = 'none';
            };
            div.appendChild(eject);
            
        }
       // h2.innerHTML = stream.extra.username;
        
    }
    if (stream.type === 'local') {
        var leave = document.createElement('button');
        leave.className = 'eject';
        leave.title = connection.isInitiator ? 'Close conference' : 'Leave conference';
        leave.onclick = function () {
           
            if (connection.getAllParticipants().length == 0 && connection.isInitiator)
                DeleteConferenceFromDb(connection.extra.id);

            // disconnect with all users
            connection.getAllParticipants().forEach(function (pid) {
                connection.disconnectWith(pid);
            });

            // stop all local cameras
            connection.attachStreams.forEach(function (localStream) {
                localStream.stop();
            });

            // close socket.io connection
            connection.close();

            //switch tabs
            SwitchTabOnCloseConference();

            this.parentNode.style.display = 'none';
        };
        div.appendChild(leave);
       // h2.innerHTML = "Me";
        
    }    

    div.appendChild(stream.mediaElement);   
    div.appendChild(h2);

    return div;
}




connection.session.data = true; // enable data channels //needed for user ejection

//needed for user ejection
connection.onmessage = function (event) {
    if (event.data.userRemoved === true) {
        if (event.data.removedUserId == connection.userid) {
            alert(connection.userid + "has been ejected from conference.");
            connection.close();
            connection.closeSocket();
        }
    }
};

connection.maxParticipantsAllowed = 4; // one-to-one
connection.onRoomFull = function (roomid) {
    alert('Room is full.');
};

connection.onUserIdAlreadyTaken = function (useridAlreadyTaken, yourNewUserId) {
    alert('user id taken');
    if (connection.enableLogs) {
        console.warn('Userid already taken.', useridAlreadyTaken, 'Your new userid:', yourNewUserId);
    }

    connection.join(useridAlreadyTaken);
};
// ......................................................
// .......................UI Code........................
// ......................................................

function JoinButtonClick(roomId,dbId) {

    $("#joinModalOkBtn").click(function () {
        
        if (!$('#joinNameText').val()) {
             $('#joinNameTextVal').text('Please provide name.');
        }
        else {           
            
            connection.join(roomId, function (isJoinedRoom, roomid, error) {
                
                if (error) {                    
                    if (error === 'Room not available') {
                        alert('This room does not exist. Please either create it or wait for moderator to enter in the room.');
                        return;
                    }
                    alert(error);
                }                
                else
                {
                    var username = $('#joinNameText').val();
                    connection.extra = {
                        username: username,
                        id: dbId
                    }
                    connection.updateExtraData();
                    this.disabled = true;
                    $('#conferenceDetail').hide();
                    $('#videoContainer').show();
                    $('#chatContainer').show();
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
         
    $.ajax({
        type: "POST",
        url: url,
        data:  $('#__AjaxAntiForgeryForm').serialize(),
        datatype: "json",
        success: function (data) {
            
            //connection.interval = 1000;              

            connection.extra = {
                username: $('#SessionId').val(),
                id: data,
            } 
                      
            $('#conferenceDetail').hide();
            $('#videoContainer').show();
            $('#chatContainer').show();
            connection.open($('#Title').val(), function (isRoomOpened, roomid, error) {

                if (isRoomOpened === true) {                   
                    SetRoomId();
                    
                    showRoomURL(connection.sessionid);
                }
                else {
                  

                    if (error === 'Room not available') {
                        alert('Someone already created this room. Please either join or create a separate room.');
                        connection.close();
                        connection.closeSocket();
                        return;
                    }
                    alert(error);
                }
            });          
           
        },
        error: function () {
            $('#conferenceDetail').show();
            $('#videoContainer').hide();
            $('#chatContainer').hide();
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

function DeleteConferenceFromDb(dbId) {
       
    var url = $("#deleteConference").val();

    $.ajax({
        type: "POST",
        url: url,
        data: { sessionId: dbId },
     
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
    $('#chatContainer').hide();
    activateTab(activateTab, 'all');
}
// ......................................................
// ......................Handling Room-ID................
// ......................................................
function showRoomURL(roomid) {
    var roomHashURL = '#' + roomid;
    var roomQueryStringURL = window.location.origin + '?roomid=' + roomid +'&session='+connection.extra.id;
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
                                        username: $('#joinNameText').val(),
                                        id: params.session,
                                }
                                    this.disabled = true;
                                    $('#conferenceDetail').hide();
                                    $('#videoContainer').show();
                                    $('#chatContainer').show();
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

    connection.onopen = function (event) {
        //connection.send({
        //    time: Date.now(),
        //    userid: connection.userid,
        //    sender: connection.extra.username,
        //    message: 'new participant joined'
        //});

       
    };

    connection.onmessage = function (event) {
        
        var rootEl = document.getElementById('chat-history-list');
        //var listItem = document.createElement('li');

        //var userInfoDiv = document.createElement('div');
        //userInfoDiv.setAttribute('class', 'message-data');
        //userInfoDiv.innerHTML = '<span class="message-data-name">' + event.data.sender + '</span> <i class="fa fa-circle me"></i>';
        //userInfoDiv.innerHTML += '<span class="message-data-time">' + event.data.time + '</span> &nbsp; &nbsp';
        

        //var chatDiv = document.createElement('div');
        //chatDiv.setAttribute('class', 'message my-message float-left');
        //chatDiv.innerHTML = event.data.message;

        //listItem.appendChild(userInfoDiv);
        //listItem.appendChild(chatDiv);

        //rootEl.appendChild(listItem);

        // responses
        var templateResponse = Handlebars.compile($("#message-response-template").html());
        var contextResponse = {
            response: event.data.message,
            time: event.data.time,
            sender: event.data.sender
        };
        this.$chatHistory = $('.chat-history');
        this.$chatHistoryList = this.$chatHistory.find('ul');
        this.$chatHistoryList.append(templateResponse(contextResponse));
        this.scrollToBottom();
       
              
    };

    (function () {

        var chat = {
            messageToSend: '',           
            init: function () {
                this.cacheDOM();
                this.bindEvents();
                this.render();
            },
            cacheDOM: function () {
                this.$chatHistory = $('.chat-history');
                this.$button = $('#chatSendBtn');
                this.$textarea = $('#message-to-send');
                this.$chatHistoryList = this.$chatHistory.find('ul');
            },
            bindEvents: function () {
                this.$button.on('click', this.addMessage.bind(this));
                this.$textarea.on('keyup', this.addMessageEnter.bind(this));
            },
            render: function () {
                this.scrollToBottom();
                if (this.messageToSend.trim() !== '') {
                    var template = Handlebars.compile($("#message-template").html());
                    var context = {
                        messageOutput: this.messageToSend,
                        time: this.getCurrentTime(),
                        sender: connection.extra.username
                    };

                    this.$chatHistoryList.append(template(context));
                    this.scrollToBottom();
                    this.$textarea.val('');

                    

                    
                }

            },

            addMessage: function () {
                connection.send({
                    time: this.getCurrentTime(),
                    userid: connection.userid,
                    sender: connection.extra.username,
                    message: $('#message-to-send').val()
                });

                
                this.messageToSend = $('#message-to-send').val()
                this.render();
            },
            addMessageEnter: function (event) {
                // enter was pressed
                if (event.keyCode === 13) {
                    this.addMessage();
                }
            },
            scrollToBottom: function () {
                this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
            },
            getCurrentTime: function () {
                return new Date().toLocaleTimeString().
                        replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
            },
            getRandomItem: function (arr) {
                return arr[Math.floor(Math.random() * arr.length)];
            }

        };

        chat.init();

        //var searchFilter = {
        //    options: { valueNames: ['name'] },
        //    init: function () {
        //        var userList = new List('people-list', this.options);
        //        var noItems = $('<li id="no-items-found">No items found</li>');

        //        userList.on('updated', function (list) {
        //            if (list.matchingItems.length === 0) {
        //                $(list.list).append(noItems);
        //            } else {
        //                noItems.detach();
        //            }
        //        });
        //    }
        //};

        //searchFilter.init();

    })();
    