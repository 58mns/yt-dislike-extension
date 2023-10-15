async function wait(duration) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

function dislikeFormatter(count) {
  //decimals only shown if count is one digit after K, M or B (like 1.6K, 1.6M or 1.6B)
  let formattedString = "";
  if (count < 1000) {
    formattedString = `${count}`;
  } else if (count < 1000000) {
    //1000 - 999999
    //check thousands aka K
    let countString = `${count / 1000.0}`;
    let countStringList = countString.split(".");
    if (countStringList[0].length === 1) {
      //(decimal after comma shown)
      formattedString = `${countStringList[0]}.${countStringList[1].substring(
        0,
        1
      )}K`;
    } else {
      //(decimal after comma NOT shown)
      formattedString = `${countStringList[0]}K`;
    }
  } else if (count < 1000000000) {
    //1000000 - 999999999
    //check millions aka M
    let countString = `${count / 1000000.0}`;
    let countStringList = countString.split(".");
    if (countStringList[0].length === 1) {
      //(decimal after comma shown)
      formattedString = `${countStringList[0]}.${countStringList[1].substring(
        0,
        1
      )}M`;
    } else {
      //(decimal after comma NOT shown)
      formattedString = `${countStringList[0]}M`;
    }
  } else {
    //1000000000 - 999999999999
    //check billions aka B
    let countString = `${count / 1000000000.0}`;
    let countStringList = countString.split(".");
    if (countStringList[0].length === 1) {
      //(decimal after comma shown)
      formattedString = `${countStringList[0]}.${countStringList[1].substring(
        0,
        1
      )}B`;
    } else {
      //(decimal after comma NOT shown)
      formattedString = `${countStringList[0]}B`;
    }
  }

  return formattedString;
}

async function doThing() {
  //wait a little bit until DOM is fully loaded
  await wait(500);

  //get the video url
  let id = window.location.href.split("v=")[1];
  id = id.split("&")[0]; //filter out other parameters like the time a user has already watched
  let url = `https://returnyoutubedislikeapi.com/votes?videoId=${id}`;

  //get the dislike from the returnyoutubedislikeapi api (more info at https://www.returnyoutubedislike.com/)
  const response = await fetch(url);
  const videoDetails = await response.json();
  let dislikeCount = `${await videoDetails.dislikes}`;

  //format the dislike count
  dislikeCount = dislikeFormatter(dislikeCount);

  //check if dislike count is added because of previous videos
  //if it already added, only the count has to be changed (the HTML element can be reused)
  let dislikeElements = document.querySelectorAll(".dislikeCount");
  let elementsCount = dislikeElements.length;

  if (elementsCount > 0) {
    //dislike count element(s) already added from previous videos
    dislikeElements[0].innerHTML = dislikeCount;
  } else {
    //dislike count element to be added for the first time
    let selector =
      "ytd-toggle-button-renderer.ytd-segmented-like-dislike-button-renderer";
    let parent = document.querySelectorAll(selector)[1];
    parent.style.display = "flex";

    let childHTML = `<div class="dislikeCount" style="background-color: var(--yt-spec-badge-chip-background); padding-left: 15px; display: flex; align-items: center;">
    ${dislikeCount}</div>`;

    parent.insertAdjacentHTML("afterbegin", childHTML);
  }
}

function waitForAddedNode(params) {
  new MutationObserver(function (mutations) {
    let el = document.querySelector(params.selector);
    if (el) {
      this.disconnect();
      params.done();
    }
  }).observe(document, {
    childList: true,
    subtree: true,
  });
}

waitForAddedNode({
  selector:
    "ytd-toggle-button-renderer.ytd-segmented-like-dislike-button-renderer",
  done: async function () {
    await doThing();
  },
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // listen for messages sent from background.js
  if (request.message === "hello!") {
    //console.log(request.url) // new url is now in content scripts!
    waitForAddedNode({
      selector:
        "ytd-toggle-button-renderer.ytd-segmented-like-dislike-button-renderer",
      done: async function () {
        await doThing();
      },
    });
  }
});
