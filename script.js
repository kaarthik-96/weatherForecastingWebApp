const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');
const currentWeatherItemsEl = document.getElementById('current-weather-items');
const timezone = document.getElementById('time-zone');
const countryEl = document.getElementById('country');
const weatherForecastEl = document.getElementById('weather-forecast');
const currentTempEl = document.getElementById('current-temp');
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const useCurrentLocationBtn = document.getElementById('use-current-location-btn');
const suggestionsList = document.getElementById('suggestions-list');

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const API_KEY = '499a1ded26cbbc70c025c9848da12800';

let previousSearches = JSON.parse(localStorage.getItem('previousSearches')) || [];

setInterval(() => {
    const time = new Date();
    const month = time.getMonth();
    const date = time.getDate();
    const day = time.getDay();
    const hour = time.getHours();
    const hoursIn12HrFormat = hour >= 13 ? hour % 12 : hour;
    const minutes = time.getMinutes();
    const ampm = hour >= 12 ? 'PM' : 'AM';

    timeEl.innerHTML = `${hoursIn12HrFormat < 10 ? '0' + hoursIn12HrFormat : hoursIn12HrFormat}:${minutes < 10 ? '0' + minutes : minutes} <span id="am-pm">${ampm}</span>`;
    dateEl.innerHTML = `${days[day]}, ${date} ${months[month]}`;
}, 1000);

const loadingIndicator = document.getElementById('loading-indicator');

function showLoading() {
    loadingIndicator.style.display = 'block';
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
}

function getWeatherData() {
    showLoading();
    navigator.geolocation.getCurrentPosition((success) => {
        const { latitude, longitude } = success.coords;
        fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=hourly,minutely&units=metric&appid=${API_KEY}`)
            .then(res => res.json())
            .then(data => {
                showWeatherData(data);
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                alert('Unable to retrieve weather data. Please try again.');
            })
            .finally(() => {
                hideLoading();
            });
    }, (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location. Please enter a city manually.');
        hideLoading();
    });
}

useCurrentLocationBtn.addEventListener('click', () => {
    getWeatherData();
});

function showWeatherData(data) {
    const { humidity, pressure, sunrise, sunset, wind_speed } = data.current;

    timezone.innerHTML = data.timezone;
    countryEl.innerHTML = `${data.lat}N, ${data.lon}E`;

    currentWeatherItemsEl.innerHTML = `
        <div class="weather-item"><div>Humidity</div><div>${humidity}%</div></div>
        <div class="weather-item"><div>Pressure</div><div>${pressure} hPa</div></div>
        <div class="weather-item"><div>Wind Speed</div><div>${wind_speed} m/s</div></div>
        <div class="weather-item"><div>Sunrise</div><div>${window.moment(sunrise * 1000).format('HH:mm a')}</div></div>
        <div class="weather-item"><div>Sunset</div><div>${window.moment(sunset * 1000).format('HH:mm a')}</div></div>
    `;

    let otherDayForecast = '';
    data.daily.forEach((day, idx) => {
        if (idx === 0) {
            currentTempEl.innerHTML = `
                <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}@4x.png" alt="weather icon" class="w-icon">
                <div class="other">
                    <div class="day">${window.moment(day.dt * 1000).format('dddd')}</div>
                    <div class="temp">Night - ${day.temp.night}&#176;C</div>
                    <div class="temp">Day - ${day.temp.day}&#176;C</div>
                </div>`;
        } else {
            otherDayForecast += `
                <div class="weather-forecast-item">
                    <div class="day">${window.moment(day.dt * 1000).format('ddd')}</div>
                    <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="weather icon" class="w-icon">
                    <div class="temp">Night - ${day.temp.night}&#176;C</div>
                    <div class="temp">Day - ${day.temp.day}&#176;C</div>
                </div>`;
        }
    });

    weatherForecastEl.innerHTML = otherDayForecast;
}

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherDataByCity(city);
        storeSearch(city);
        updateSuggestions();
    }
});

cityInput.addEventListener('input', () => {
    const query = cityInput.value.toLowerCase();
    if (query) {
        showSuggestions(query);
    } else {
        suggestionsList.style.display = 'none';
    }
});

cityInput.addEventListener('blur', () => {
    setTimeout(() => {
        suggestionsList.style.display = 'none';
    }, 100); 
});

function getWeatherDataByCity(city) {
    showLoading();
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('City not found');
            }
            return response.json();
        })
        .then(data => {
            const { lat, lon } = data.coord;

            return fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=hourly,minutely&units=metric&appid=${API_KEY}`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error fetching forecast data');
            }
            return response.json();
        })
        .then(data => {
            showWeatherData(data);
            updateLocationDetails(city, data.timezone);
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            alert('City not found or unable to retrieve forecast. Please try again.');
        })
        .finally(() => {
            hideLoading();
        });
}


function storeSearch(city) {
    if (!previousSearches.includes(city)) {
        previousSearches.push(city);
        localStorage.setItem('previousSearches', JSON.stringify(previousSearches));
    }
}

function updateSuggestions() {
    if (previousSearches.length > 0) {
        suggestionsList.innerHTML = previousSearches.map(city => `<li>${city}</li>`).join('');
        suggestionsList.style.display = 'none'; 
    }
}

async function showSuggestions(query) {
    const url = `https://api.openweathermap.org/data/2.5/find?q=${query}&type=like&sort=population&cnt=5&appid=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error fetching city suggestions');
        }

        const data = await response.json();
        const cities = data.list.map(city => `${city.name}, ${city.sys.country}`);

        if (cities.length > 0) {
            suggestionsList.innerHTML = cities.map(city => `<li>${city}</li>`).join('');
            suggestionsList.style.display = 'block';
        } else {
            suggestionsList.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
        suggestionsList.style.display = 'none';
    }
}

function updateLocationDetails(city, countryCode) {
    timezone.innerText = city;
    countryEl.innerText = countryCode;
}

suggestionsList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        cityInput.value = e.target.textContent;
        getWeatherDataByCity(cityInput.value);
        suggestionsList.style.display = 'none';
    }
});

getWeatherData(); 
updateSuggestions();
