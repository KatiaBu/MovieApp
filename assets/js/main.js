// API
const apiKey = 'bef075c365f811a286c385f0b22262b0';
const url = 'https://api.themoviedb.org/3/search/movie?api_key=bef075c365f811a286c385f0b22262b0';

// Selecting DOM elements & global variables
const searchInput = document.querySelector('.c-search__input');
const searchBtn = document.querySelector('.c-search__btn');
const resultsList = document.querySelector('.c-search__list');
let resultsArray = [];
let searchPhrase = '';

// RegExp for filtering titles
// value - string to check
// searchValue - string to check with
const stringMatches = (value, searchValue) => {
    const reg1 = new RegExp(searchValue, 'gi');
    const reg2 = new RegExp(searchValue.replace('&', 'and'), 'gi');
    const reg3 = new RegExp(searchValue.replace('and', '&'), 'gi');
    return value.match(reg1) || value.match(reg2) || value.match(reg3);
}

//Wrapping function 
// s - String to wrap
// w - number of chars
const wrap = (s, w) => s.replace(
    new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n'
);

// Fetching data from API
async function getDataAsync() {
    try {
        searchPhrase = searchInput.value;
        console.log('getData: ' + searchPhrase);
        const newUrl = url + '&query=' + searchPhrase;
        const res = await fetch(newUrl);
        const json = await res.json();
        const totalPages = await json.total_pages;
        for (let i = 1; i <= totalPages; i++) {
            const secondRes = await fetch(newUrl + '&page=' + i); //Second fetch to get data from all pages
            const secondJson = await secondRes.json();
            secondJson.results.forEach(item => {
                const title = item.title;
                const originalTitle = item.original_title;
                if (((stringMatches(title, searchPhrase)) || (stringMatches(originalTitle, searchPhrase))) && ((item.release_date !== undefined) && (item.release_date !== ''))) {
                    resultsArray.push(item);
                }
            })
        }
        console.log(resultsArray);
        return resultsArray;
    } catch (err) {
        console.log(err);
    }

}

// Displaying fetched data
function displayData() {
    while (resultsList.firstChild) {
        resultsList.removeChild(resultsList.firstChild);
    }

    console.log('displayData: ' + searchPhrase);
    resultsArray.forEach(item => {
        const title = item.title;
        const originalTitle = item.original_title;
        const releaseDate = item.release_date;
        const year = releaseDate.slice(0, 4);
        const poster = item.poster_path;
        const resultsItem = document.createElement('li');
        const itemTitle = document.createElement('span');
        const itemYear = document.createElement('span');
        const innerSpan = document.createElement('span');
        const itemImg = document.createElement('img');
        resultsItem.setAttribute('class', 'c-search__item');
        resultsItem.setAttribute('movie_id', item.id);
        itemTitle.setAttribute('class', 'c-search__item-title');
        itemYear.setAttribute('class', 'c-search__item-year');
        innerSpan.setAttribute('class', '_inner-span');
        itemImg.setAttribute('class', 'c-search__item-img');
        if ((title === originalTitle) || ((title !== originalTitle) && (stringMatches(title, searchPhrase)))) {
            itemTitle.innerText = title;
        } else {
            itemTitle.innerText = originalTitle;
        }

        itemTitle.innerText = wrap(itemTitle.innerText, 50);

        if (poster !== null) {
            itemImg.src = `https://image.tmdb.org/t/p/w92/${poster}`;
        } else {
            itemImg.src = 'assets/img/poster_fallback_w92.jpg';
        }
        innerSpan.innerText = `(${year})`;
        resultsItem.appendChild(itemTitle);
        itemYear.appendChild(innerSpan);
        resultsItem.appendChild(itemYear);
        resultsItem.appendChild(itemImg);
        resultsList.appendChild(resultsItem);
        resultsItem.addEventListener('click', displayMovieDetails);
    })

    searchBtn.classList.remove('btn--loading');

}

// Click event for .c-search__btn
async function searchButtonClick(event) {
    event.preventDefault();
    searchBtn.classList.add('btn--loading');
    const getMovies = await getDataAsync();
    const displayMovies = await displayData();
    resultsArray = [];
}

searchBtn.addEventListener('click', searchButtonClick);


function displayMovieDetails(e) {
    let movieId = e.currentTarget.getAttribute('movie_id')

    fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits`, {
        method: 'GET',
    })
        .then(resp => resp.json())
        .then(resp => {
            document.getElementById("title").innerText = resp.original_title
            document.getElementById("rating").innerText = resp.vote_average
            if (resp.poster_path !== null) document.getElementById("poster").src = `https://image.tmdb.org/t/p/w185_and_h278_bestv2${resp.poster_path}`;
            else document.getElementById("poster").src = 'assets/img/poster_fallback_w92.jpg';
            document.getElementById("director").innerText = `Director: ${getDirector(resp.credits.crew)}`;
            document.getElementById("genre").innerText = `Genre: ${getGenres(resp.genres)}`;
            document.getElementById("release").innerText = `Release date: ${resp.release_date}`;
            document.getElementById("overview").innerText = resp.overview
            AddCrew(resp.credits.cast);
        })
        .then(resp => {
            carousel_cast()
        })

    fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}`, {
        method: 'GET',
    })
        .then(resp => resp.json())
        .then(resp => {
            if (resp.results.length > 0) {
                document.getElementById("trailer_title").innerText = resp.results[0].name;
                document.getElementById("play_trailer").style.backgroundImage = `url('https://i.ytimg.com/vi/${resp.results[0].key}/hqdefault.jpg')`;
                document.getElementById("play_trailer").setAttribute("href", `https://www.themoviedb.org/video/play?key=${resp.results[0].key}`);
            } else document.getElementById("info_trailer").classList.add("hidden");
        })

    fetch(`https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${apiKey}`, {
        method: 'GET',
    })
        .then(resp => resp.json())
        .then(resp => {
            const similar_movie = document.getElementById("similar")
            if (resp.results.length > 0) {
                resp.results.forEach(movie => {
                    const div = document.createElement('div')
                    div.classList.add("item")
                    const img = document.createElement('img')
                    img.src = `https://image.tmdb.org/t/p/w92/${movie.poster_path}`;
                    div.appendChild(img)
                    similar_movie.appendChild(div)
                });
            } else document.getElementById("info_similar").classList.add("hidden");
        })
        .then(resp => {
            carousel_similar()
        })
        .then(resp => {
            document.getElementById("container").classList.remove("hidden")
        })

    xMarkButton = document.getElementById('x_mark')
    xMarkButton.addEventListener('click', closeMovieDetails);
}

function closeMovieDetails() {
    document.getElementById("container").classList.add("hidden")
    const trailer = document.getElementById("info_trailer");
    if (trailer.classList.contains("hidden")) trailer.classList.remove("hidden")
    const infoSimilar = document.getElementById("info_similar");
    if (infoSimilar.classList.contains("hidden")) infoSimilar.classList.remove("hidden")
    const cast = document.getElementById("cast-div")
    cast.innerHTML = "";
    const similar = document.getElementById("similar-div")
    similar.innerHTML = "";
    const cast_carousel = document.createElement("div")
    const similar_carousel = document.createElement("div");
    cast_carousel.classList.add("owl-carousel", "owl-theme", "cast");
    similar_carousel.classList.add("owl-carousel", "owl-theme", "similar");
    cast_carousel.id = "cast";
    similar_carousel.id = "similar";
    similar.appendChild(similar_carousel);
    cast.appendChild(cast_carousel);
}

function getDirector(crew) {
    var newArray = crew.filter(function (el) {
        return el.job == 'Director';
    });
    if (newArray.length > 0) return newArray[0].name;
    return '';
}

const getGenres = (genre) => {
    var list = '';
    genre.forEach(function (el, i) {
        list += el.name
        if (i != genre.length - 1)
            list += ', ';
    })
    return list;
}

const AddCrew = (crew) => {
    const cast = document.getElementById("cast");
    cast.innerHTML = ''
    crew.forEach(function (el, i) {
        const div = document.createElement('div')
        div.classList.add("item")
        const img = document.createElement('img')
        if (el.profile_path != null) img.src = `https://image.tmdb.org/t/p/w235_and_h235_face/${el.profile_path}`;
        else img.src = 'assets/img/poster_fallback_w92.jpg'
        const h = document.createElement('h3')
        h.innerHTML = `<strong>${el.name}</strong> as ${el.character}`
        div.appendChild(img)
        div.appendChild(h)
        cast.appendChild(div)
    })
}

function carousel_cast() {
    $('.cast').owlCarousel({
        loop: true,
        margin: 10,
        responsive: {
            0: {
                items: 1
            },
            200: {
                items: 2
            },
            500: {
                items: 3
            },
            600: {
                items: 4
            },
            960: {
                items: 5
            },
            1200: {
                items: 6
            }
        }
    });
}
function carousel_similar() {
    $('.similar').owlCarousel({
        loop: true,
        margin: 10,
        responsive: {
            0: {
                items: 1
            },
            200: {
                items: 2
            },
            500: {
                items: 3
            },
            960: {
                items: 5
            },
            1200: {
                items: 6
            }
        }
    });
}

