const API_KEY = ''; // Add your actual API key here
const BASE_URL = 'http://localhost:27017/';


let inputValue= document.getElementsByClassName('modal-input')[0]
inputValue.addEventListener('keypress', async () => {
  const zipCode = document.querySelector('.modal-input').value;
  console.log(zipCode)
  try {
    const  convertedCity  = await getCityNameByZip(zipCode) ;
    if (convertedCity) {
      inputValue.value = convertedCity;
      document.getElementsByClassName('search-input')[0].textContent = convertedCity;
    } else {
      console.error('No city found for the provided zip code.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});

// Function to get weather data for a specific city
 async function getWeatherData(zipCode) {
  try {
    const convertedCity = await getCityNameByZip(zipCode);
    if (!convertedCity) {
      throw new Error('City not found for the provided zip code.');
    }
    const url = `${BASE_URL}queries/min-max-near-me?postleitzahl=${convertedCity}&apiKey=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(data);
    return { convertedCity, data };
  } catch (error) {
    console.error('Error fetching the weather data:', error);
  }
}

// Function to get city name by zip code
async function getCityNameByZip(zipCode) {
  try {
    const response = await fetch("city.json");
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    const data = await response.json();
    const result = data.find((city) => city.Postleitzahl === zipCode);
    console.log(result);
    return result ? result.Name : null;
  } catch (error) {
    console.error('Error fetching the city data:', error);
  }
}
