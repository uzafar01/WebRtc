﻿
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
    video: true,    
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
connection.enableFileSharing = true;
connection.autoSaveToDisk = false;

connection.onstream = function (event) {
    var existing = document.getElementById(event.streamid);
    if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
    }
    event.mediaElement.removeAttribute('src');
    event.mediaElement.removeAttribute('srcObject');
 
    if (event.type === 'local') {
         event.mediaElement.muted = true;
         event.mediaElement.volume = 0;
        var video = getVideo(event, event.extra);
        document.getElementById('local-video-container').appendChild(video);

    }
    if (event.type === 'remote') {
        var video = getVideo(event, event.extra);
        var remoteVideosContainer = document.getElementById('local-video-container');
        remoteVideosContainer.appendChild(video, remoteVideosContainer.firstChild);
        var recorder = connection.recorder;
        if (recorder) {
            recorder.getInternalRecorder().addStreams([event.stream]);
            connection.recorder.streams.push(event.stream);
        }
    }

    if (event.type === 'screen') {
        alert('screen');
    }
    
    event.mediaElement.width = innerWidth / 3.4;

    event.mediaElement.width = 600;

    rotateVideo(event.mediaElement);
    scaleVideos();

    // to keep room-id in cache
    localStorage.setItem(connection.socketMessageEvent, connection.sessionid);
    
    if (event.type === 'local') {
        connection.socket.on('disconnect', function () {
            if (!connection.getAllParticipants().length) {
                location.reload();
            }
        });
    }
       

    
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
            showDialog('Please select external microphone. ');
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
    var videoInRow = 2;
    var minus = 77;
    var windowHeight = 700;
    var windowWidth = 600;
    var windowAspectRatio = windowWidth / windowHeight;
    var videoAspectRatio = 4 / 3;
    var blockAspectRatio;
    var tempVideoWidth = 0;
    var maxVideoWidth = 0;
    for (var i = videoInRow; i > 0; i--) {
        blockAspectRatio = i * videoAspectRatio / Math.ceil(videoInRow / i);
        if (blockAspectRatio <= windowAspectRatio) {
            tempVideoWidth = videoAspectRatio * windowHeight / Math.ceil(videoInRow / i);
        } else {
            tempVideoWidth = windowWidth / i;
        }
        if (tempVideoWidth > maxVideoWidth)
            maxVideoWidth = tempVideoWidth;
    }
    for (var i = 0; i < length; i++) {
        video = videos[i];
        if (video) {
            video.width = maxVideoWidth - minus;            
        }
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

    if (connection.isInitiator) {
        connection.extra.isInitiator = true;
        connection.updateExtraData();
    }
    if (stream.type === 'remote') {
        if (connection.isInitiator) {
            connection.extra.isInitiator = true;
            connection.updateExtraData();

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

        h2.innerHTML = stream.extra.username;
        div.title = stream.extra.username;
            
            
    
       // h2.innerHTML = stream.extra.username;
        
    }
    if (stream.type === 'local') {
        var leave = document.createElement('button');
        leave.className = 'eject';
        leave.title =  'Leave conference';
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
       
        if (stream.extra.username) {
            div.title = stream.extra.username;
            h2.innerHTML = stream.extra.username ;
        }
        else {
            setTimeout(function () {
                div.title = connection.extra.username ? connection.extra.username : 'Me';
                h2.innerHTML = connection.extra.username ? connection.extra.username : 'Me';
            },4000);
        }
           
        setTimeout(function () {
            connection.send({
                message: connection.extra.username + ' has joined on ' + getCurrentTime(),
                alert: true
            });
        }, 2000);
        div.appendChild(leave);
        // h2.innerHTML = "Me";

       
    }    

    div.appendChild(stream.mediaElement);   
    div.appendChild(h2);
    return div;
}

connection.session.data = true; // enable data channels //needed for user ejection



connection.maxParticipantsAllowed = 4; // one-to-one
connection.onRoomFull = function (roomid) {
    showDialog('Room is full.');
};

connection.onUserIdAlreadyTaken = function (useridAlreadyTaken, yourNewUserId) {
    showDialog('user id taken',true);
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
                        showDialog('This room does not exist. Please either create it or wait for moderator to enter in the room.',true);
                        return;
                    }
                    showDialog(error, true);
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
                    showDialog(error, true);
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
// ......................Video Panel buttons................
// ......................................................

$('#inviteBtn').on("click", function () {
    SetRoomId();

    showRoomURL(connection.sessionid);
    $('#roomUrlModal').modal('show');

});

$('#chatBtn').on("click", function (e) {
    $("#chatContainer").toggle();
});

$('#shareScreenBtn').on("click", function (e) {

    var cameraOptions = {

        screen: true,
        audio: true
    };

    connection.captureUserMedia(function (camera) {
        var video = document.createElement('video');
        video.src = URL.createObjectURL(camera);
        video.muted = true;

        var streamLocalEvent = {
            type: 'screen',
            stream: camera,
            streamid: camera.id,
            mediaElement: video,
            isScreen: true
        };


      //  connection.addStream(streamLocalEvent);

        connection.onstream(streamLocalEvent);
        //connection.onstream(streamRemoteEvent);
    }, cameraOptions);

    //     var audioStream = captureUsingGetUserMedia();
    //var screenStream = captureUsingGetUserMedia();

    //var audioTrack = audioStream.getAudioTracks()[0];

    //// add audio tracks into screen stream
    //screenStream.addTrack( audioTrack );


    //connection.addStream( screenStream );
    //connection.createOffer(success, failure, options);
});

$('#recordBtn').on("click", function (e) {

    if ($(this).attr("title") === "Record Conference") {
        
        $(this).find('i').removeClass('fa fa-play-circle fa-2x').addClass('fa fa-stop-circle fa-2x')

        $(this).attr("title", "Stop Recording");
        $('#recordPara').text("Stop");

        var recorder = connection.recorder;
        if (!recorder) {
            
            connection.streamEvents.selectAll().forEach(function (streamEvent) {

                var stream = streamEvent.stream;
              
                if (stream) {
                    if (!recorder) {
                        recorder = RecordRTC([stream], {
                            type: 'video'
                        });
                        recorder.startRecording();
                        connection.recorder = recorder;
                    }
                    else {
                        recorder.getInternalRecorder().addStreams([stream]);
                    }

                    if (!connection.recorder.streams) {
                        connection.recorder.streams = [];
                    }
                    connection.recorder.streams.push(event.stream);
                }
            });           
           
        }      
       
    }
    else {
        $(this).find('i').toggleClass('fa fa-stop-circle fa-2x').addClass('fa fa-play-circle fa-2x');
        $(this).attr("title", "Record Conference");
        $('#recordPara').text("Record");

        var recorder = connection.recorder;
        if (!recorder) return showDialog('Error occurred while recording session.', true); 
        recorder.stopRecording(function () {
            var blob = recorder.getBlob();
            invokeSaveAsDialog(blob);
            connection.recorder = null;
        });
    }

});

$('#endConferenceBtn').on("click", function (e) {
    
    if (connection.extra.isInitiator) {
        connection.send({
            closeAll: true            
        });

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
    }
});

$('#muteBtn').on("click", function (e) {
    if ($(this).attr("title") === "UnMute") {

        var localStream = connection.attachStreams[0];
        localStream.unmute('audio');
        $(this).find('i').toggleClass('fas fa-microphone-slash fa-2x').addClass('fas fa-microphone fa-2x');
        $(this).attr("title", "Mute");
        $('#mutePara').text("Mute");
    }
    else {
        var localStream = connection.attachStreams[0];
        localStream.mute('audio');
        $(this).find('i').removeClass('fas fa-microphone fa-2x').addClass('fas fa-microphone-slash fa-2x');
        $(this).attr("title", "UnMute");
        $('#mutePara').text("UnMute");
    }
});

$('#shareFileBtn').click(function () {
    $('#shareFileInput').click();
});

var fileInput = document.getElementById('shareFileInput');
fileInput.onchange = function () {
    connection.fbr = null;
    var file = this.files[0];

    if (!file) return;
    connection.send(file);
};

// www.RTCMultiConnection.org/docs/onFileEnd/
connection.onFileEnd = function (file) {
     
    if (file.remoteUserId === connection.userid) {
       var user =  $('#' + file.userid).attr("title");
       var message = '<h5>'+user + '  sent file <a href="' + file.url + '" target="_blank" download="' + file.name + '">' + file.name + '</a>' + ' Size: ' + bytesToSize(file.size) + '.</h5>';
       appendLog(message);    

    }
    else {
        var message = '<h5> You shared file <a href="' + file.url + '" target="_blank" download="' + file.name + '">' + file.name + '</a>' + ' Size: ' + bytesToSize(file.size) + '.</h5>';
        appendLog(message);

    }

    $("div[title='" + file.name + "']").remove();
};
function appendLog(html) {
    $("#chatContainer").show();
    var chatHistory = $('.chat-history');
    var chatHistoryList = chatHistory.find('ul');
    var listItem = document.createElement('li');
    var chatDiv = document.createElement('div');
    chatDiv.innerHTML = html;
    chatDiv.setAttribute('class', 'alert');
    listItem.appendChild(chatDiv);
    chatHistoryList.append(listItem);
    
}
// ......................................................
// ......................Handling Room-ID................
// ......................................................

function showRoomURL(roomid) {
    var roomHashURL = '#' + roomid;
    var roomQueryStringURL = window.location.origin + '?roomid=' + roomid +'&session='+connection.extra.id;
    var html = '<h4>Invite users by sharing URL below:</h4><br>';    
   
    html += '<a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';
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
    showDialog('2G is not supported. Please use a better internet service.', true);   
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
                                        showDialog('This room does not exist. Please either create it or wait for moderator to enter in the room.', true); 
                                        return;
                                    }
                                    showDialog(error, true);
                                }
                                else {
                                    connection.extra = {
                                        username: $('#joinNameText').val(),
                                        id: params.session,
                                    }                                    
                                    connection.updateExtraData();
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
                            showDialog('This room does not exist.', true);
                            return;
                        }
                        //setTimeout(reCheckRoomPresence, 5000);
                    });
                })();
            }
        });
       
    }

   
// ......................................................
// ......................Chat................
// ......................................................

    //needed for user ejection
    connection.onmessage = function (event) {
       
        if (event.data.userRemoved === true) {
            if (event.data.removedUserId == connection.userid) {
                showDialog(connection.userid + "has been ejected from conference.");
                connection.close();
                connection.closeSocket();
            }
        }
        else if (event.data.closeAll === true) {
            
                connection.close();
                connection.closeSocket();
          
        }
        else {
            var rootEl = document.getElementById('chat-history-list');
            this.$chatHistory = $('.chat-history');
            this.$chatHistoryList = this.$chatHistory.find('ul');
            if (event.data.alert) {
                var listItem = document.createElement('li');
                var chatDiv = document.createElement('div');
                chatDiv.innerHTML = '<h5>' + event.data.message + '<h5>';
                chatDiv.setAttribute('class', 'alert');
                listItem.appendChild(chatDiv);
                this.$chatHistoryList.append(listItem);
            }
            else {
                // responses
                var templateResponse = Handlebars.compile($("#message-response-template").html());
                var contextResponse = {
                    response: event.data.message,
                    time: event.data.time,
                    sender: event.data.sender
                };

                this.$chatHistoryList.append(templateResponse(contextResponse));
            }
            scrollToBottom();
        }
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
                        time: getCurrentTime(),
                        sender: connection.extra.username
                    };

                    this.$chatHistoryList.append(template(context));
                    this.scrollToBottom();
                    this.$textarea.val('');

                    

                    
                }

            },

            addMessage: function () {
                connection.send({
                    time: getCurrentTime(),
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

    function getCurrentTime() {
    return new Date().toLocaleTimeString().
            replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
}

    function scrollToBottom() {
      this.$chatHistory = $('.chat-history');        
    this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
}
    
    function showDialog(msg, isError) {
        $(".notify").addClass("notify-active");
        $("#notify").text(msg);
                
        if (!isError) {
            setTimeout(function () {
                $(".notify").removeClass("notify-active");
                //   $(".notify").val('');
            }, 5000);
        }
    }