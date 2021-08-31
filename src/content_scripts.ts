chrome.browserAction.onClicked.addListener((tab: chrome.tabs.Tab) => {
  // alert("before")
  console.log("before");
  url2md(tab);
  // alert("after")
  console.log("after");
});

const url2md = (tab: chrome.tabs.Tab) => {
  const url = tab.url;
  const pattern = /(.jpe?g)|(.png)|(.gif)|(.webp)$/;
  const isImg = pattern.test(url);
  const title = tab.title;
  // []() | ![]()
  const mdUrl = `${isImg ? "!" : ""}[${title}](${url})`;

  console.log(mdUrl);

  setTimeout(() => {
    navigator.clipboard.writeText(mdUrl);
  }, 500);
  navigator.clipboard.writeText(mdUrl);
  console.log("copied!");
  alert("url2md");
};
