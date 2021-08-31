chrome.browserAction.onClicked.addListener((tab: chrome.tabs.Tab) => {
  console.log("before");
  url2md(tab);
  console.log("after");
});

const url2md = async (tab: chrome.tabs.Tab) => {
  const url = tab.url;
  const pattern = /\.(jpe?g|png|gif|webp)$/;
  const isImg = pattern.test(url);
  const title = tab.title;
  // []() | ![]()
  const mdUrl = `${isImg ? "!" : ""}[${title}](${url})`;
  const e = document.createElement("textarea");
  e.value = mdUrl;
  document.querySelector("body").append(e);
  e.select();
  document.execCommand("copy");
  e.remove();
};
