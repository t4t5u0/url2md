import browser from "webextension-polyfill";

const url2md = () => {
  //
  const url = document.URL;
  const pattern = /(.jpe?g)|(.png)|(.gif)|(.webp)$/;
  const isImg = pattern.test(url);
  const title = document.title;
  // []() | ![]()
  const mdUrl = `${isImg ? "!" : ""}[${title}](${url})`;
  navigator.clipboard.writeText(mdUrl);
  console.log("copied!");
  alert("url2md");
};

const execute = async () => {
  // alert("execute");
  // browser.browserAction.onClicked.addListener(url2md);
  browser.browserAction.onClicked.addListener(url2md);
  alert("execute")
};

execute();
