const API_KEY = ''; // Add your actual API key here
const BASE_URL = 'http://localhost:27017/';
let city = 'Berlin';
let convertedCity = '';

const modal = document.getElementById("search-modal");
const searchButton = document.getElementById("search-btn");
const searchInput = document.getElementsByClassName("search-input")[0];
const modalInput = document.getElementsByClassName("modal-input")[0];
const textSearch = document.getElementById("text-search");
const textClose = document.getElementsByClassName("modal-text-close")[0];

searchButton.onclick = function() {
  modal.style.display = "block";
}

textSearch.onclick = function() {
  convertedCity = modalInput.value;
  getWeatherData(convertedCity);
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

document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector(".card");

  function postHeight() {
    window.parent.postMessage({
      provider: "DAVIZ",
      type: "embed-size",
      height: document.body.clientHeight,
    }, "*");
  }

  new ResizeObserver(postHeight).observe(container);
});

const inputValue = document.querySelector('.modal-input');
inputValue.addEventListener('keyup', async (event) => {
  if (event.key === 'Enter') { // Only trigger on Enter key press
    const zipCode = inputValue.value.trim();
    console.log(zipCode);
    try {
      const cityName = await getCityNameByZip(zipCode);
      if (cityName) {
        convertedCity = cityName;
        inputValue.value = convertedCity;
        document.querySelector('.search-input').textContent = convertedCity;
      } else {
        console.error('No city found for the provided zip code.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
});

// Function to get city name by zip code
async function getCityNameByZip(zipCode) {
  try {
    const response = await fetch("./data/city.json");
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    const data = await response.json();
    const result = data.find(city => city.Postleitzahl === zipCode);
    return result ? result.Name : null;
  } catch (error) {
    console.error('Error fetching the city data:', error);
  }
}

async function getWeatherData(city) {
  try {
    const response = await fetch(`./data/${city}.json`);
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    const data = await response.json();
    const element = document.querySelector("#tempChart");

    if (!element) {
      throw new Error("Chart element not found");
    }

    let myTempChart = tempChart({
      element: element,
      data,
    });

    if (!myTempChart || typeof myTempChart.remove !== 'function') {
      throw new Error("tempChart did not return a valid chart instance with a remove method");
    }

    // Make a copy of the data and modify it
    const newData = JSON.parse(JSON.stringify(data)); // Deep copy the data
    const lastDataPoint = newData[newData.length - 1];
    if (lastDataPoint) {
      lastDataPoint.value += 10; // Modify the value for example
    }

    // Remove old chart
    const oldChart = document.getElementsByClassName("main-svg")[0];
    if (oldChart) oldChart.remove();
    
    // Recreate chart element
    const newElement = document.createElement("div");
    newElement.id = "tempChart";
    element.parentNode.replaceChild(newElement, element);

    // Create new chart with modified data
    myTempChart = tempChart({
      element: newElement,
      data: newData,
    });

    if (!myTempChart || typeof myTempChart.remove !== 'function') {
      throw new Error("tempChart did not return a valid chart instance with a remove method");
    }

  } catch (error) {
    console.error('Error fetching the weather data:', error);
  }
}

// Initial fetch for default city
(async () => {
  try {
    const response = await fetch(`./data/${city}.json`);
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    const data = await response.json();
    const element = document.querySelector("#tempChart");

    if (!element) {
      throw new Error("Chart element not found");
    }

    let myTempChart = tempChart({
      element: element,
      data,
    });
  } catch (error) {
    console.error('Error fetching the initial weather data:', error);
  }
})();
