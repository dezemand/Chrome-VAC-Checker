var strangers = [].slice.call(document.querySelectorAll('.friendCheckbox2'));
var friends = [].slice.call(document.querySelectorAll('.friendCheckbox'));

strangers.forEach(function(stranger) {
  var id = stranger.outerHTML.match('friends\\[(.*?)\\]')[1];
  getVACBan(id, stranger.parentNode.parentNode, setMessage);
});

friends.forEach(function(friend) {
  var url = friend.parentNode.children[1].getAttribute('onclick').split("top.location.href='")[1].split("'")[0];
  if(url.indexOf("/profile/") === -1 && (url.indexOf("/id/") !== -1)) {
    resolveVanityURL(url.split("/id/")[1], function(err, steamid) {
      if(err) {alert(err); return;}
      getVACBan(steamid, friend.parentNode, setMessage);
    });
  } else {
    getVACBan(url.split("/profile/")[1], friend.parentNode, setMessage);
  }
});

function getVACBan(steamID, div, Callback) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if(xmlhttp.readyState === XMLHttpRequest.DONE && xmlhttp.status === 200) {
      return Callback(JSON.parse(xmlhttp.responseText).players[0], div);
    }
  };
  xmlhttp.open('GET', 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=F6F90A461E30D38AB4AE8AADB5AD8658&steamids='+steamID, true);
  xmlhttp.send();
}

function setMessage(data, div) {
  var span = document.createElement('span');
  span.style.fontWeight = 'bold';
  span.style.display = 'block';
  span.style.color = (data.NumberOfVACBans) ? 'rgb(255, 73, 73)' : 'rgb(43, 203, 64)';
  if(data.NumberOfVACBans) span.innerHTML = chrome.i18n.getMessage("foundvac", [data.NumberOfVACBans, data.DaysSinceLastBan]);
  else span.innerHTML = chrome.i18n.getMessage("novac");
  div.querySelector('.friendSmallText').appendChild(span);
}

function resolveVanityURL(vanityurl, Callback) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if(xmlhttp.readyState === XMLHttpRequest.DONE && xmlhttp.status === 200) {
      var data = JSON.parse(xmlhttp.responseText);
      if(data.response.success == 1) return Callback(null, data.response.steamid);
      else return Callback(new Error("Could not resolve Vanity URL "+vanityurl), null);
    }
  };
  xmlhttp.open('GET', "http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=F6F90A461E30D38AB4AE8AADB5AD8658&vanityurl=" + vanityurl, true);
  xmlhttp.send();

}
