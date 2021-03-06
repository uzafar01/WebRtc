﻿$(document).ready(function () {
    
});

// Muaz Khan     - https://github.com/muaz-khan
// MIT License   - https://www.webrtc-experiment.com/licence/
// Documentation - https://github.com/muaz-khan/RTCMultiConnection

var quickConferenceUrl = '';

var connection = new RTCMultiConnection();
var sessions = {};
//var sessionsCount = 0;

connection.session = {
    audio: true,
    video: true
};
//connection.maxParticipantsAllowed = 2;
connection.autoCloseEntireSession = true;

//connection.onRequest = function (request) {
//    alert(connection.numberOfConnectedUsers);
//    if ((connection.numberOfConnectedUsers + 1) <= 2) {
//        connection.accept(request);
//        return;
//    }
//    else {
//        alert("Room is full");
//      //  connection.reject(request);
//        return;
//    }
//};
connection.onstream = function (e) {   
    if (e.type === 'local') {
        var video = getVideo(e, {
            username: window.username
        });
        document.getElementById('local-video-container').appendChild(video);
    }
    if (e.type === 'remote') {
        var video = getVideo(e, e.extra);
        var remoteVideosContainer = document.getElementById('remote-videos-container');
        remoteVideosContainer.appendChild(video, remoteVideosContainer.firstChild);
    }
    e.mediaElement.width = innerWidth / 3.4;

    e.mediaElement.width = 600;
        
    rotateVideo(e.mediaElement);
    scaleVideos();
};
function rotateVideo(mediaElement) {
    mediaElement.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(0deg)';
    setTimeout(function () {
        mediaElement.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(360deg)';
    }, 1000);
}

connection.onstreamended = function (e) {

    e.mediaElement.style.opacity = 0;
    rotateVideo(e.mediaElement);
    setTimeout(function () {        
        if (e.mediaElement && e.mediaElement.parentNode && e.mediaElement.parentNode.parentNode) {
            e.mediaElement.parentNode.parentNode.removeChild(e.mediaElement.parentNode);
        }
       
        scaleVideos();
    }, 1000);
};


function getVideo(stream, extra) {
    var div = document.createElement('div');
    div.className = 'video-container';
    div.id = stream.userid || 'self';
    if (stream.type === 'remote') {
        if (connection.isInitiator) {
            var eject = document.createElement('button');
            eject.className = 'eject';
            eject.title = 'Eject this User';
            eject.onclick = function () {
                // eject a specific user
                connection.eject(this.parentNode.id);
                this.parentNode.style.display = 'none';
            };
            div.appendChild(eject);
        }
    }
    if (stream.type === 'local')
    {
        var leave = document.createElement('button');
        leave.className = 'eject';
        leave.title = connection.isInitiator ? 'Close conference' : 'Leave conference';
        leave.onclick = function () {
            if (connection.isInitiator) {               
                connection.close();
            }
            else {                
                connection.leave();
            }
           this.parentNode.style.display = 'none';
        };
        div.appendChild(leave);
    }
    div.appendChild(stream.mediaElement);
    if (extra) {
        var h2 = document.createElement('h2');
        h2.innerHTML = extra.username;
        div.appendChild(h2);
    }
    return div;
}


// check if user is ejected
// clear rooms-list if user is ejected
connection.onSessionClosed = function (event) {
    if (event.isEjected) {       

        roomsList.innerHTML = '';
        roomsList.style.display = 'block';
    }
};


connection.onNewSession = function (session) {
         

    buildSessionInfo(session);
};


function buildSessionInfo(session) {
  
    if (sessions[session.sessionid]) {        
        return;
    }

    sessions[session.sessionid] = session;

    
    var tr = '';
    var td = '';
    var joinRoomButton = '';   
    

    var innerhtml = '<div class="pricing-box-item">' +
                                     '<div class="pricing-heading">' +
                                     '<h3><strong>Room</strong></h3>' +
                                     '</div>' +
                                     '<div class="pricing-container">' +
                                     '<ul>' +
                                     '<li><i class="icon-ok"></i><strong>' + session.sessionid + '</strong> is running a conference!</li>' +
                                      '</ul>' +
                                     '</div>' +
                                     '<div class="pricing-action">' +
                                     '<button class="btn btn-medium btn-theme join"><i class="icon-bolt"></i> Join</button>' +
                                     '</div>' +
                                     '</div>';

    
    if (sessionsCount < 4) {
        td = document.createElement('td');

        td.setAttribute('data-sessionid', session.sessionid);

        if (sessionsCount == 0)
            td.innerHTML = '<tr>' + innerhtml + '</tr>';
        else
            td.innerHTML = innerhtml;

        roomsList.append(td);
        joinRoomButton = td.querySelector('.join');
        sessionsCount += 1;

    } else  {
        tr = document.createElement('tr');
        td = document.createElement('td');
        td.setAttribute('data-sessionid', session.sessionid);
        td.innerHTML =  innerhtml ;
        tr.innerHTML = td.innerHTML;

        roomsList.append(tr);
        joinRoomButton = tr.querySelector('.join');

        sessionsCount = 1;
    }
    

    joinRoomButton.setAttribute('data-sessionid', session.sessionid);
    joinRoomButton.onclick = function () {

        if (!window.username) window.username = prompt('Please enter your username') || 'Anonymous';
        connection.extra = {
            username: window.username
        };

        this.disabled = true;
        var sessionid = this.getAttribute('data-sessionid');
        session = sessions[sessionid];
        if (!session) throw 'No such session exists.';       
        connection.join(session);       
        
    };
}


//var videosContainer = document.getElementById('videos-container') || document.body;

var roomsList = document.getElementById('rooms-list');
function SetupNewConference() {

    if (!window.username) window.username = prompt('Please enter your username') || 'Anonymous';
    connection.extra = {
        username: window.username
    };
    connection.interval = 1000;
    connection.sessionid = window.username;
   
    connection.open();
    buildSessionInfo(connection);
    this.disabled = true;
  //  window.location.href = quickConferenceUrl;
    //connection.open(document.getElementById('conference-name').value || 'Anonymous');
};
// setup signaling to search existing sessions
connection.connect();

(function () {
    var uniqueToken = document.getElementById('unique-token');
    if (uniqueToken)
        if (location.hash.length > 2) uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center;"><a href="' + location.href + '" target="_blank">Share this link</a></h2>';
        else uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
})();
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

