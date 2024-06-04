const modal = document.getElementById("search-modal");
    const searchButton = document.getElementById("search-btn");
    const searchInput = document.getElementsByClassName("search-input")[0];
    const modalInput = document.getElementsByClassName("modal-input")[0];
    const textSearch = document.getElementById("text-search");
    const textClose= document.getElementsByClassName("modal-text-close")[0];

    searchButton.onclick = function() {
      modal.style.display = "block";
    }

    textSearch.onclick = function() {
       // searchInput.value = modalInput.value;
        modal.style.display = "none";
      }

    textClose.onclick = function() {
      modal.style.display = "none";
    }

window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }