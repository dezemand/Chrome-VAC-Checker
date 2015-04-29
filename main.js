var strangers = [].slice.call(document.querySelectorAll('.friendCheckbox2'));
var friends = [].slice.call(document.querySelectorAll('.friendCheckbox'));
var total = strangers.length + friends.length;
var people = [];
var query = [];

strangers.forEach(function(stranger) {
  var id = stranger.outerHTML.match('friends\\[(.*?)\\]')[1];
  addPeople({id: id, html: stranger.parentNode.parentNode, last: false});
});

friends.forEach(function(friend) {
  var url = friend.parentNode.children[1].getAttribute('onclick').split("top.location.href='")[1].split("'")[0];
  if(url.indexOf("/profile/") === -1 && (url.indexOf("/id/") !== -1))
    resolveVanityURL(url.split("/id/")[1], function(err, steamid) {addPeople({id: steamid, html: friend.parentNode, last: false});});
  else
    addPeople({id: url.split("/profile/")[1], html: friend.parentNode, last: false});
});

function addPeople(obj) {
  people.push(obj);
  if(people.length == total) {
    var j = 0;
    var last = false;
    for(i=0; i<people.length; i++) {
      getCache(people[i], function(err, obj, vac) {
        j++; if(j == total) last = true;
        if(vac && (vac.expire > (new Date().getTime()))) {
          setMessage(vac, obj.html);
        } else {
          getAPIVAC(obj, last, function(data, person) {
            setCache(person, data, function() {});
            setMessage(data, person.html);
          });
        }
      });
    }
  }
}

function getAPIVAC(person, last, Callback) {
  query.push({obj: person, callback: Callback});
  if(query.length > 99 || last) {
    var url = 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=F6F90A461E30D38AB4AE8AADB5AD8658&steamids='+query[0].obj.id;
    for(i=1; i<query.length; i++) {
      url += ","+query[i].obj.id;
    }
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if(xmlhttp.readyState === XMLHttpRequest.DONE && xmlhttp.status === 200) {
        var players = JSON.parse(xmlhttp.responseText).players;
        for(i=0; i<players.length; i++) {
          for(j=0; j<query.length; j++) {
            if(players[i].SteamId == query[j].obj.id) {
              query[j].callback(players[i], query[j].obj);
            }
          }
        }
        query = [];
      }
    };
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
  }
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

function getCache(person, Callback) {
  chrome.storage.local.get("cache_"+person.id, function(obj, items) {
    if(Object.keys(obj).length == 0) return Callback(null, person, null);
    return Callback(null, person, obj["cache_"+person.id]);
  });
}

function setCache(person, data, Callback) {
  var obj = {};
  obj["cache_"+person.id] = {expire: (new Date().getTime() + 1000*60*60*24), NumberOfVACBans: data.NumberOfVACBans, DaysSinceLastBan: data.DaysSinceLastBan};
  chrome.storage.local.set(obj, function() {
    return Callback();
  });
}
