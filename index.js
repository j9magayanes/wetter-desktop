fetch("temp.json")
  .then((res) => res.json())
  .then((data) => {
    tempChart({
      element: document.querySelector("#tempChart"),
      data,
    });
  });
