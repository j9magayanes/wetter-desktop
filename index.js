document.addEventListener("DOMContentLoaded", function () {
  var container = document.querySelector(".card");

  function postHeight() {
    window.parent.postMessage({
        provider: "DAVIZ",
        type: "embed-size",
        height: document.body.clientHeight,
    }, "*");
  }

  new ResizeObserver(postHeight).observe(container);

  fetch("temp.json")
    .then((res) => res.json())
    .then((data) => {
      tempChart({
        element: document.querySelector("#tempChart"),
        data,
      });
    });
});
