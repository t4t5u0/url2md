chrome.browserAction.onClicked.addListener((tab: chrome.tabs.Tab) => {
  alert("before")
  url2md(tab);
  alert("after")
});

const url2md = (tab: chrome.tabs.Tab) => {
  const url = document.URL;
  const pattern = /(.jpe?g)|(.png)|(.gif)|(.webp)$/;
  const isImg = pattern.test(url);
  const title = document.title;
  // []() | ![]()
  const mdUrl = `${isImg ? "!" : ""}[${title}](${url})`;
  setTimeout(() => {
    navigator.clipboard.writeText(mdUrl);
  }, 500);
  navigator.clipboard.writeText(mdUrl);
  console.log("copied!");
  alert("url2md");
};
