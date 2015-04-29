var strangers = [].slice.call(document.querySelectorAll('.friendCheckbox2'));
var friends = [].slice.call(document.querySelectorAll('.friendCheckbox'));
var total = strangers.length + friends.length;
var people = [];
var query = [];

strangers.forEach(function(stranger) {
  var id = stranger.outerHTML.match('friends\\[(.*?)\\]')[1];
  addPeople({id: id, html: stranger.parentNode.parentNode});
});

friends.forEach(function(friend) {
  var url = friend.parentNode.children[1].getAttribute('onclick').split("top.location.href='")[1].split("'")[0];
  if(url.indexOf("/profile/") === -1 && (url.indexOf("/id/") !== -1))
    resolveVanityURL(url.split("/id/")[1], function(err, steamid) {addPeople({id: steamid, html: friend.parentNode});});
  else
    addPeople({id: url.split("/profile/")[1], html: friend.parentNode});
});

function addPeople(obj) {
  people.push(obj);
  if(people.length == total) {
    for(i=0; i<people.length; i++) {
      getCache(people[i], function(err, obj, vac) {
        if(vac && (vac.expire > (new Date().getTime()))) {
          setMessage(vac, obj.html);
        } else {
          getAPIVAC(obj, function(data, person) {
            setCache(person, data, function() {});
            setMessage(data, person.html);
          });
        }
      });
    }
  }
}

function getAPIVAC(person, Callback) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if(xmlhttp.readyState === XMLHttpRequest.DONE && xmlhttp.status === 200) {
      return Callback(JSON.parse(xmlhttp.responseText).players[0], person);
    }
  };
  xmlhttp.open('GET', 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=F6F90A461E30D38AB4AE8AADB5AD8658&steamids='+person.id, true);
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

chrome.storage.local.get("cache_76561198126170311", function(obj, items) {console.log(obj["cache_76561198126170311"], items);});
