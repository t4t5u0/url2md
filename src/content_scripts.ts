import browser from "webextension-polyfill";

const execute = async () => {
  //
  const url = document.URL;
  const pattern = /(.jpe?g)|(.png)|(.gif)|(.webp)$/;
  const isImg = pattern.test(url);
  const title = document.title;
  // []() | ![]()
  const mdUrl = `${isImg ? "!" : ""}[${title}](${url})`;
  await navigator.clipboard.writeText(mdUrl);
  console.log("copied!");
};

execute();
