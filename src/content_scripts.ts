// chrome.contextMenus.onClicked.addListener(
//   (_info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) => {
//     // alert("before")
//     console.log("before");
//     url2md(tab).then(() => {
//       console.log("after");
//     });
//   }
// );

chrome.browserAction.onClicked.addListener((tab: chrome.tabs.Tab) => {
  console.log("before");
  url2md(tab).then(() => {
    console.log("after");
  });
});

const url2md = async (tab: chrome.tabs.Tab) => {
  const url = tab.url;
  const pattern = /\.(jpe?g|png|gif|webp)$/;
  const isImg = pattern.test(url);
  const title = tab.title;
  // []() | ![]()
  const mdUrl = `${isImg ? "!" : ""}[${title}](${url})`;

  console.log(mdUrl);

  // setTimeout(async () => {
  //   await navigator.clipboard.writeText(mdUrl);
  // }, 500);
  // await navigator.clipboard.writeText(mdUrl);
  // if (navigator.clipboard) {
  //   navigator.clipboard.writeText(mdUrl);
  // } else {
  //   console.log("navigator.clipboard: ", navigator.clipboard);
  // }
  console.log("copied!");
  alert("url2md");
};
