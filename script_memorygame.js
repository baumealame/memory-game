




var GAME8 = GAME8 || {};

GAME8.Game = (function() {

    var activeCards = [];
    var numOfCards;
    var cardHitCounter = 0;
    var card;
    var timer;
    var storage;

    /**
     * Method that will be invoked on card click
     */
    function handleCardClick() {

        var connection = $(this).data('connection');
        var hit;

        // Set card in active state
        // 'this' needs to be attached to context of card which is clicked
        if ( !$(this).hasClass('active') ) {
            $(this).addClass('active');
            activeCards.push($(this));

            // If user click on two cards then check
            if (activeCards.length == 2) {
                hit = checkActiveCards(activeCards);
            }

            if (hit === true) {
                cardHitCounter++;
                activeCards[0].add(activeCards[1]).unbind().addClass('wobble cursor-default');
                activeCards = [];

                // Game End
                if(cardHitCounter === (numOfCards / 2)) {
                    // Reset active cards
                    activeCards = [];
                    // Reset counter
                    cardHitCounter = 0;
                    // End game
                    endGame();
                }
            }
            // In case when user open more then 2 cards then automatically close first two
            else if(activeCards.length === 3) {
                for(var i = 0; i < activeCards.length - 1; i++) {
                    activeCards[i].removeClass('active');
                }
                activeCards.splice(0, 2);
            }
        }
    }

    function endGame() {
        timer.stopTimer();

        // Retrieve current time
        var time = timer.retrieveTime();

        // Retrieve time from storage
        var timeFromStorage = storage.retrieveBestTime();

        // if there's already time saved in storage check if it's better than current one
        if (timeFromStorage != undefined && timeFromStorage != '') {
            // if current game time is better than one saved in store then save new one
            if (time.minutes < timeFromStorage.minutes || (time.minutes == timeFromStorage.minutes && time.seconds < timeFromStorage.seconds) ) {
                storage.setBestTime(time);
            }
        }
        // else if time is not saved in storage save it
        else {
            storage.setBestTime(time);
        }

        // Update best time
        timer.updateBestTime();
    }

    function checkActiveCards(connections) {
        return connections[0].data('connection') === connections[1].data('connection');
    }

    return function(config) {

        /**
         * Main method for game initialization
         */
        this.startGame = function() {
            card = new GAME8.Card();
            timer = new GAME8.Timer();
            storage = new GAME8.Storage();
            numOfCards = config.cards.length;
            card.attachCardEvent(handleCardClick, config);
        };

        /**
         * After game initialization call this method in order to generate cards
         */
        this.generateCardSet = function() {
            // Generate new card set
            card.generateCards(config.cards);
            // Reset active cards array
            activeCards = [];

            // Reset timer
            timer.stopTimer();
            // Set timer
            timer.startTimer();
        };

        this.startGame();
    }

    
    
    

    
    
})();



GAME8.Card = (function () {

    // Private variables
    var $cardsContainer = $('#cards-container-game8');
    var $cardTemplate = $('#card-template-game8');

    /**
     * Private method
     * Take card template from DOM and update it with card data
     * @param {Object} card - card object
     * @return {Object} template - jquery object
     */
    function prepareCardTemplate (card) {
        var template = $cardTemplate
                            .clone()
                            .removeAttr('id')
                            .removeClass('hide')
                            .attr('data-connection', card.connectionID);

        // If card has background image
        if (card.backImg != '' ) {
            template.find('.back').css({
                'background': 'url(' + card.backImg + ') no-repeat center center',
                'background-size': 'cover'
            });
        }
        // Else if card has no background image but has text
        if (card.backTxt != '') {
            template.find('.label > .name').html(card.backTxt);
            template.find('.label > .desc').html(card.desc);
        }

        return template;
    }

    /**
     * Private method
     * Method for random shuffling array
     * @param {Object} cardsArray - array of card objects
     * @return {Object} returns random shuffled array
     */
    function shuffleCards(cardsArray) {
        var currentIndex = cardsArray.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = cardsArray[currentIndex];
            cardsArray[currentIndex] = cardsArray[randomIndex];
            cardsArray[randomIndex] = temporaryValue;
        }

        return cardsArray;
    }

    return function() {

        /**
         * Public method
         * Prepare all cards and insert them into DOM
         * Before inserting new set of cards method will erase all previous cards
         * @param {Object} cards - array of card objects
         */
        this.generateCards = function(cards) {
            var templates = [];
            var preparedTemplate;

            // Prepare every card and push it to array
            cards.forEach(function (card) {
                preparedTemplate = prepareCardTemplate(card);
                templates.push(preparedTemplate);
            });

            // Shuffle card array
            templates = shuffleCards(templates);

            // Hide and empty card container
            $cardsContainer.hide().empty();

            // Append all cards to cards container
            templates.forEach(function(card) {
                $cardsContainer.append(card);
            });

            // Show card container
            $cardsContainer.fadeIn('slow');
        };

        /**
         * Public method
         * Attach click event on every card
         * Before inserting new set of cards method will erase all previous cards
         * @param {Function} func - function that will be invoked on card click
         */
        this.attachCardEvent = function(func) {
            $cardsContainer.unbind().on('click', '.flip-container', function() {
                func.call(this);
            });
        }
    }

    



    
    
    
    
})();

GAME8.Timer = (function() {

    var $timer = $('.timer');
    var $seconds = $timer.find('#seconds');
    var $minutes = $timer.find('#minutes');
    var $bestTimeContainer = $timer.find('.time');


    var minutes, seconds;

    function decorateNumber(value) {
        return value > 9 ? value : '0' + value;
    }

    return function() {
        var interval;
        var storage = new GAME8.Storage();

        this.startTimer = function() {
            var sec = 0;
            var bestTime;

            // Set timer interval
            interval = setInterval( function() {
                seconds = ++sec % 60;
                minutes = parseInt(sec / 60, 10);
                $seconds.html(decorateNumber(seconds));
                $minutes.html(decorateNumber(minutes));
            }, 1000);

            // Show timer
            $timer.delay(1000).fadeIn();

            this.updateBestTime();
        };

        this.updateBestTime = function() {
            // Check if user have saved best game time
            bestTime = storage.retrieveBestTime();
            if(bestTime != undefined && bestTime != '') {
                $bestTimeContainer
                    .find('#bestTime')
                    .text(bestTime.minutes + ':' + bestTime.seconds)
                    .end()
                    .fadeIn();
            }
        };

        this.stopTimer = function() {
            clearInterval(interval);
        };

        this.retrieveTime = function() {
            return {
                minutes: decorateNumber(minutes),
                seconds: decorateNumber(seconds)
            }
        };
    }
})();



GAME8.Storage = (function() {

    return function() {

        /**
         * Save best time to localStorage
         * key = 'bestTime'
         * @param {Object} time - object with keys: 'minutes', 'seconds'
         */
        this.setBestTime = function(time) {
            localStorage.setItem('bestTime', JSON.stringify(time));
        };

        /**
         * Retrieve best time from localStorage
         */
        this.retrieveBestTime = function() {
            return JSON.parse(localStorage.getItem('bestTime'));
        };

    }
})();



// Game init
$(function() {

        var game8 = new GAME8.Game({
            cards: [
                {
                    backImg: './img/01.png',
                    backTxt: '권기옥',
                    desc: '비행사·출판인·독립운동가',
                    year: '(대한민국, 1901–1988)',
                    quote: '“남자가 하는 일 중에 여자라고 못할 일이 뭐가 있소.<br>이끌어야지. 앞장서서 이끌란 말이야.<br>달에다 내 발바닥 지문을 탁 찍고 오겠다는 패기 정도는 가져야 하지 않겠는가.”',
                    connectionID: 1
                },
                {
                    backImg: './img/01.png',
                    backTxt: '권기옥',
                    desc: '비행사·출판인·독립운동가',
                    year: '(대한민국, 1901–1988)',
                    quote: '“남자가 하는 일 중에 여자라고 못할 일이 뭐가 있소.<br>이끌어야지. 앞장서서 이끌란 말이야.<br>달에다 내 발바닥 지문을 탁 찍고 오겠다는 패기 정도는 가져야 하지 않겠는가.”',
                    connectionID: 1
                },
                {
                    backImg: './img/02.png',
                    backTxt: '김명순',
                    desc: '소설가·시인',
                    year: '(대한민국, 1896–미상)',
                    quote: '“조선아 내가 너를 영결할 때, 죽은 시체에게라도 더 학대해다오.<br>그래도 부족하거든 이다음에 나 같은 사람 나더라도,<br>할 수 있는 대로 또 학대해보아라.”',
                    connectionID: 2
                },
                {
                    backImg: './img/02.png',
                    backTxt: '김명순',
                    desc: '소설가·시인',
                    year: '(대한민국, 1896–미상)',
                    quote: '“조선아 내가 너를 영결할 때, 죽은 시체에게라도 더 학대해다오.<br>그래도 부족하거든 이다음에 나 같은 사람 나더라도,<br>할 수 있는 대로 또 학대해보아라.”',
                    connectionID: 2
                },
                {
                    backImg: './img/03.png',
                    backTxt: '김점동',
                    desc: '의사',
                    year: '(대한민국, 1876–1910)',
                    quote: '“지금 포기한다면 내겐 그 어떤 기회도 없다는 것을 잘 압니다.<br>그러므로 그것이 신의 뜻이라 해도 의사 공부를 포기할 생각이 없습니다.”',
                    connectionID: 3
                },
                {
                    backImg: './img/03.png',
                    backTxt: '김점동',
                    desc: '의사',
                    year: '(대한민국, 1876–1910)',
                    quote: '“지금 포기한다면 내겐 그 어떤 기회도 없다는 것을 잘 압니다.<br>그러므로 그것이 신의 뜻이라 해도 의사 공부를 포기할 생각이 없습니다.”',
                    connectionID: 3
                },

                {
                    backImg: './img/05.png',
                    backTxt: '나혜석',
                    desc: '화가·소설가',
                    year: '(대한민국, 1896–1948)',
                    quote: '“여자도 사람이외다.”',
                    connectionID: 4
                },
                {
                    backImg: './img/05.png',
                    backTxt: '나혜석',
                    desc: '화가·소설가',
                    year: '(대한민국, 1896–1948)',
                    quote: '“여자도 사람이외다.”',
                    connectionID: 4
                },

                {
                    backImg: './img/09.png',
                    backTxt: '박남옥',
                    desc: '영화감독',
                    year: '(대한민국, 1923–2017)',
                    quote: '“나는 하루라도 더 살고 싶다.<br>우리나라 여성 영화인들이 좋은 작품을 만들고<br>세계로 진출하는 것도 보고 싶다.”',
                    connectionID: 5
                },
                {
                    backImg: './img/09.png',
                    backTxt: '박남옥',
                    desc: '영화감독',
                    year: '(대한민국, 1923–2017)',
                    quote: '“나는 하루라도 더 살고 싶다.<br>우리나라 여성 영화인들이 좋은 작품을 만들고<br>세계로 진출하는 것도 보고 싶다.”',
                    connectionID: 5
                },
                {
                    backImg: './img/12.png',
                    backTxt: '부춘화',
                    desc: '해녀·독립운동가',
                    year: '(대한민국, 1908–1995)',
                    quote: '“칼을 들이대면 겁먹을 줄 아느냐?<br>우리는 죽을 각오로 나왔다.”',
                    connectionID: 6
                },
                {
                    backImg: './img/12.png',
                    backTxt: '부춘화',
                    desc: '해녀·독립운동가',
                    year: '(대한민국, 1908–1995)',
                    quote: '“칼을 들이대면 겁먹을 줄 아느냐?<br>우리는 죽을 각오로 나왔다.”',
                    connectionID: 6
                },
                {
                    backImg: './img/14.png',
                    backTxt: '이태영',
                    desc: '변호사, 여성운동가',
                    year: '(대한민국, 1914–1998)',
                    quote: '“귀중하게 태어난 인간,<br>법 앞에서라도 만인이 다 평등하게 살아야 한다.”',
                    connectionID: 7
                },
                {
                    backImg: './img/14.png',
                    backTxt: '이태영',
                    desc: '변호사·여성운동가',
                    year: '(대한민국, 1914–1998)',
                    quote: '“귀중하게 태어난 인간,<br>법 앞에서라도 만인이 다 평등하게 살아야 한다.”',
                    connectionID: 7
                },
                {
                    backImg: './img/19.png',
                    backTxt: '허정숙',
                    desc: '여성운동가·언론인',
                    year: '(대한민국, 1902–1991)',
                    quote: '“남의 아내, 남의 며느리가 되어<br>한갓 그 집안 시부모와 남편 한 사람만을 공경하는 것보다<br>오히려 사람으로서의 개성을 살리고 인권을 차지하는 것이<br>우리 눈앞에 급박한 큰 문제다.”',
                    connectionID: 8
                },
                {
                    backImg: './img/19.png',
                    backTxt: '허정숙',
                    desc: '여성운동가·언론인',
                    year: '(대한민국, 1902–1991)',
                    quote: '“남의 아내, 남의 며느리가 되어<br>한갓 그 집안 시부모와 남편 한 사람만을 공경하는 것보다<br>오히려 사람으로서의 개성을 살리고 인권을 차지하는 것이<br>우리 눈앞에 급박한 큰 문제다.”',
                    connectionID: 8
                },
            ]
        });

        $('#btn-start-game8').click(function() {
            game8.generateCardSet();
            $('#btn-start-game8').addClass('hide');
            $('#btn-start-game12').addClass('hide');
            $('#btn-start-game20').addClass('hide');
            $('#btn-refresh').removeClass('hide');
            $('#level-game8').removeClass('hide');
            $('.wrapper_btn').addClass('hide');
            $('.eng-title').addClass('hide');
            $('.footer').addClass('hide');
        });

    });







var GAME12 = GAME12 || {};

GAME12.Game = (function() {

    var activeCards = [];
    var numOfCards;
    var cardHitCounter = 0;
    var card;
    var timer;
    var storage;

    /**
     * Method that will be invoked on card click
     */
    function handleCardClick() {

        var connection = $(this).data('connection');
        var hit;

        // Set card in active state
        // 'this' needs to be attached to context of card which is clicked
        if ( !$(this).hasClass('active') ) {
            $(this).addClass('active');
            activeCards.push($(this));

            // If user click on two cards then check
            if (activeCards.length == 2) {
                hit = checkActiveCards(activeCards);
            }

            if (hit === true) {
                cardHitCounter++;
                activeCards[0].add(activeCards[1]).unbind().addClass('wobble cursor-default');
                activeCards = [];
                

                // Game End
                if(cardHitCounter === (numOfCards / 2)) {
                    // Reset active cards
                    activeCards = [];
                    // Reset counter
                    cardHitCounter = 0;
                    // End game
                    endGame();
                }
            }
            // In case when user open more then 2 cards then automatically close first two
            else if(activeCards.length === 3) {
                for(var i = 0; i < activeCards.length - 1; i++) {
                    activeCards[i].removeClass('active');
                }
                activeCards.splice(0, 2);
            }
        }
    }

    function endGame() {
        timer.stopTimer();

        // Retrieve current time
        var time = timer.retrieveTime();

        // Retrieve time from storage
        var timeFromStorage = storage.retrieveBestTime();

        // if there's already time saved in storage check if it's better than current one
        if (timeFromStorage != undefined && timeFromStorage != '') {
            // if current game time is better than one saved in store then save new one
            if (time.minutes < timeFromStorage.minutes || (time.minutes == timeFromStorage.minutes && time.seconds < timeFromStorage.seconds) ) {
                storage.setBestTime(time);
            }
        }
        // else if time is not saved in storage save it
        else {
            storage.setBestTime(time);
        }

        // Update best time
        timer.updateBestTime();
    }

    function checkActiveCards(connections) {
        return connections[0].data('connection') === connections[1].data('connection');
    }

    return function(config) {

        /**
         * Main method for game initialization
         */
        this.startGame = function() {
            card = new GAME12.Card();
            timer = new GAME12.Timer();
            storage = new GAME12.Storage();
            numOfCards = config.cards.length;
            card.attachCardEvent(handleCardClick, config);
        };

        /**
         * After game initialization call this method in order to generate cards
         */
        this.generateCardSet = function() {
            // Generate new card set
            card.generateCards(config.cards);
            // Reset active cards array
            activeCards = [];

            // Reset timer
            timer.stopTimer();
            // Set timer
            timer.startTimer();
        };

        this.startGame();
    }

})();



GAME12.Card = (function () {

    // Private variables
    var $cardsContainer = $('#cards-container-game12');
    var $cardTemplate = $('#card-template-game12');

    /**
     * Private method
     * Take card template from DOM and update it with card data
     * @param {Object} card - card object
     * @return {Object} template - jquery object
     */
    function prepareCardTemplate (card) {
        var template = $cardTemplate
                            .clone()
                            .removeAttr('id')
                            .removeClass('hide')
                            .attr('data-connection', card.connectionID);

        // If card has background image
        if (card.backImg != '' ) {
            template.find('.back').css({
                'background': 'url(' + card.backImg + ') no-repeat center center',
                'background-size': '120%'
            });
        }
        // Else if card has no background image but has text
        if (card.backTxt != '') {
            template.find('.label > .name').html(card.backTxt);
            template.find('.label > .desc').html(card.desc);
        }

        return template;
    }

    /**
     * Private method
     * Method for random shuffling array
     * @param {Object} cardsArray - array of card objects
     * @return {Object} returns random shuffled array
     */
    function shuffleCards(cardsArray) {
        var currentIndex = cardsArray.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = cardsArray[currentIndex];
            cardsArray[currentIndex] = cardsArray[randomIndex];
            cardsArray[randomIndex] = temporaryValue;
        }

        return cardsArray;
    }

    return function() {

        /**
         * Public method
         * Prepare all cards and insert them into DOM
         * Before inserting new set of cards method will erase all previous cards
         * @param {Object} cards - array of card objects
         */
        this.generateCards = function(cards) {
            var templates = [];
            var preparedTemplate;

            // Prepare every card and push it to array
            cards.forEach(function (card) {
                preparedTemplate = prepareCardTemplate(card);
                templates.push(preparedTemplate);
            });

            // Shuffle card array
            templates = shuffleCards(templates);

            // Hide and empty card container
            $cardsContainer.hide().empty();

            // Append all cards to cards container
            templates.forEach(function(card) {
                $cardsContainer.append(card);
            });

            // Show card container
            $cardsContainer.fadeIn('slow');
        };

        /**
         * Public method
         * Attach click event on every card
         * Before inserting new set of cards method will erase all previous cards
         * @param {Function} func - function that will be invoked on card click
         */
        this.attachCardEvent = function(func) {
            $cardsContainer.unbind().on('click', '.flip-container', function() {
                func.call(this);
            });
        }
    }

})();

GAME12.Timer = (function() {

    var $timer = $('.timer');
    var $seconds = $timer.find('#seconds');
    var $minutes = $timer.find('#minutes');
    var $bestTimeContainer = $timer.find('.time');


    var minutes, seconds;

    function decorateNumber(value) {
        return value > 9 ? value : '0' + value;
    }

    return function() {
        var interval;
        var storage = new GAME12.Storage();

        this.startTimer = function() {
            var sec = 0;
            var bestTime;

            // Set timer interval
            interval = setInterval( function() {
                seconds = ++sec % 60;
                minutes = parseInt(sec / 60, 10);
                $seconds.html(decorateNumber(seconds));
                $minutes.html(decorateNumber(minutes));
            }, 1000);

            // Show timer
            $timer.delay(1000).fadeIn();

            this.updateBestTime();
        };

        this.updateBestTime = function() {
            // Check if user have saved best game time
            bestTime = storage.retrieveBestTime();
            if(bestTime != undefined && bestTime != '') {
                $bestTimeContainer
                    .find('#bestTime')
                    .text(bestTime.minutes + ':' + bestTime.seconds)
                    .end()
                    .fadeIn();
            }
        };

        this.stopTimer = function() {
            clearInterval(interval);
        };

        this.retrieveTime = function() {
            return {
                minutes: decorateNumber(minutes),
                seconds: decorateNumber(seconds)
            }
        };
    }
})();


GAME12.Storage = (function() {

    return function() {

        /**
         * Save best time to localStorage
         * key = 'bestTime'
         * @param {Object} time - object with keys: 'minutes', 'seconds'
         */
        this.setBestTime = function(time) {
            localStorage.setItem('bestTime', JSON.stringify(time));
        };

        /**
         * Retrieve best time from localStorage
         */
        this.retrieveBestTime = function() {
            return JSON.parse(localStorage.getItem('bestTime'));
        };

    }
})();



// Game init
$(function() {

        var game12 = new GAME12.Game({
            cards: [
                {
                    backImg: './img/01.png',
                    backTxt: '권기옥',
                    desc: '비행사·출판인·독립운동가',
                    connectionID: 1
                },
                {
                    backImg: './img/01.png',
                    backTxt: '권기옥',
                    desc: '비행사·출판인·독립운동가',
                    connectionID: 1
                },
                {
                    backImg: './img/02.png',
                    backTxt: '김명순',
                    desc: '소설가·시인',
                    connectionID: 2
                },
                {
                    backImg: './img/02.png',
                    backTxt: '김명순',
                    desc: '소설가·시인',
                    connectionID: 2
                },
                {
                    backImg: './img/03.png',
                    backTxt: '김점동',
                    desc: '의사',
                    connectionID: 3
                },
                {
                    backImg: './img/03.png',
                    backTxt: '김점동',
                    desc: '의사',
                    connectionID: 3
                },
                {
                    backImg: './img/19.png',
                    backTxt: '허정숙',
                    desc: '여성운동가·언론인',
                    connectionID: 4
                },
                {
                    backImg: './img/19.png',
                    backTxt: '허정숙',
                    desc: '여성운동가·언론인',
                    connectionID: 4
                },
                {
                    backImg: './img/08.png',
                    backTxt: '말랄라 유사프자이',
                    desc: '교육활동가',
                    connectionID: 5
                },
                {
                    backImg: './img/08.png',
                    backTxt: '말랄라 유사프자이',
                    desc: '교육활동가',
                    connectionID: 5
                },
                {
                    backImg: './img/11.png',
                    backTxt: '베르타 카세레스',
                    desc: '환경운동가',
                    connectionID: 6
                },
                {
                    backImg: './img/11.png',
                    backTxt: '베르타 카세레스',
                    desc: '환경운동가',
                    connectionID: 6
                },
                {
                    backImg: './img/12.png',
                    backTxt: '부춘화',
                    desc: '해녀·독립운동가',
                    connectionID: 7
                },
                {
                    backImg: './img/12.png',
                    backTxt: '부춘화',
                    desc: '해녀·독립운동가',
                    connectionID: 7
                },
                {
                    backImg: './img/13.png',
                    backTxt: '에멀린 팽크허스트',
                    desc: '사회운동가',
                    connectionID: 8
                },
                {
                    backImg: './img/13.png',
                    backTxt: '에멀린 팽크허스트',
                    desc: '사회운동가',
                    connectionID: 8
                },
                {
                    backImg: './img/14.png',
                    backTxt: '이태영',
                    desc: '변호사·여성운동가',
                    connectionID: 9
                },
                {
                    backImg: './img/14.png',
                    backTxt: '이태영',
                    desc: '변호사·여성운동가',
                    connectionID: 9
                },
                {
                    backImg: './img/15.png',
                    backTxt: '제인 구달',
                    desc: '동물행동학자·환경운동가',
                    connectionID: 10
                },
                {
                    backImg: './img/15.png',
                    backTxt: '제인 구달',
                    desc: '동물행동학자·환경운동가',
                    connectionID: 10
                },
                {
                    backImg: './img/17.png',
                    backTxt: '캐서린 존슨',
                    desc: '물리학자·수학자',
                    connectionID: 11
                },
                {
                    backImg: './img/17.png',
                    backTxt: '캐서린 존슨',
                    desc: '물리학자·수학자',
                    connectionID: 11
                },
                {
                    backImg: './img/18.png',
                    backTxt: '투유유',
                    desc: '중의학자·화학자',
                    connectionID: 12
                },
                {
                    backImg: './img/18.png',
                    backTxt: '투유유',
                    desc: '중의학자·화학자',
                    connectionID: 12
                },
            ]
        });

        $('#btn-start-game12').click(function() {
            game12.generateCardSet();
            $('#btn-start-game8').addClass('hide');
            $('#btn-start-game12').addClass('hide');
            $('#btn-start-game20').addClass('hide');
            $('#btn-refresh').removeClass('hide');
            $('#level-game12').removeClass('hide');
            $('.wrapper_btn').addClass('hide');
            $('.eng-title').addClass('hide');
            $('.footer').addClass('hide');
        });

    });




var GAME20 = GAME20 || {};

GAME20.Game = (function() {

    var activeCards = [];
    var numOfCards;
    var cardHitCounter = 0;
    var card;
    var timer;
    var storage;

    /**
     * Method that will be invoked on card click
     */
    function handleCardClick() {

        var connection = $(this).data('connection');
        var hit;

        // Set card in active state
        // 'this' needs to be attached to context of card which is clicked
        if ( !$(this).hasClass('active') ) {
            $(this).addClass('active');
            activeCards.push($(this));

            // If user click on two cards then check
            if (activeCards.length == 2) {
                hit = checkActiveCards(activeCards);
            }

            if (hit === true) {
                cardHitCounter++;
                activeCards[0].add(activeCards[1]).unbind().addClass('wobble cursor-default');
                activeCards = [];

                // Game End
                if(cardHitCounter === (numOfCards / 2)) {
                    // Reset active cards
                    activeCards = [];
                    // Reset counter
                    cardHitCounter = 0;
                    // End game
                    endGame();
                }
            }
            // In case when user open more then 2 cards then automatically close first two
            else if(activeCards.length === 3) {
                for(var i = 0; i < activeCards.length - 1; i++) {
                    activeCards[i].removeClass('active');
                }
                activeCards.splice(0, 2);
            }
        }
    }

    function endGame() {
        timer.stopTimer();

        // Retrieve current time
        var time = timer.retrieveTime();

        // Retrieve time from storage
        var timeFromStorage = storage.retrieveBestTime();

        // if there's already time saved in storage check if it's better than current one
        if (timeFromStorage != undefined && timeFromStorage != '') {
            // if current game time is better than one saved in store then save new one
            if (time.minutes < timeFromStorage.minutes || (time.minutes == timeFromStorage.minutes && time.seconds < timeFromStorage.seconds) ) {
                storage.setBestTime(time);
            }
        }
        // else if time is not saved in storage save it
        else {
            storage.setBestTime(time);
        }

        // Update best time
        timer.updateBestTime();
    }

    function checkActiveCards(connections) {
        return connections[0].data('connection') === connections[1].data('connection');
    }

    return function(config) {

        /**
         * Main method for game initialization
         */
        this.startGame = function() {
            card = new GAME20.Card();
            timer = new GAME20.Timer();
            storage = new GAME20.Storage();
            numOfCards = config.cards.length;
            card.attachCardEvent(handleCardClick, config);
        };

        /**
         * After game initialization call this method in order to generate cards
         */
        this.generateCardSet = function() {
            // Generate new card set
            card.generateCards(config.cards);
            // Reset active cards array
            activeCards = [];

            // Reset timer
            timer.stopTimer();
            // Set timer
            timer.startTimer();
        };

        this.startGame();
    }

})();



GAME20.Card = (function () {

    // Private variables
    var $cardsContainer = $('#cards-container-game20');
    var $cardTemplate = $('#card-template-game20');

    /**
     * Private method
     * Take card template from DOM and update it with card data
     * @param {Object} card - card object
     * @return {Object} template - jquery object
     */
    function prepareCardTemplate (card) {
        var template = $cardTemplate
                            .clone()
                            .removeAttr('id')
                            .removeClass('hide')
                            .attr('data-connection', card.connectionID);

        // If card has background image
        if (card.backImg != '' ) {
            template.find('.back').css({
                'background': 'url(' + card.backImg + ') no-repeat center 10%',
                'background-size': '130%'
            });
        }
        // Else if card has no background image but has text
        if (card.backTxt != '') {
            template.find('.label > .name').html(card.backTxt);
            template.find('.label > .desc').html(card.desc);
        }

        return template;
    }

    /**
     * Private method
     * Method for random shuffling array
     * @param {Object} cardsArray - array of card objects
     * @return {Object} returns random shuffled array
     */
    function shuffleCards(cardsArray) {
        var currentIndex = cardsArray.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = cardsArray[currentIndex];
            cardsArray[currentIndex] = cardsArray[randomIndex];
            cardsArray[randomIndex] = temporaryValue;
        }

        return cardsArray;
    }

    return function() {

        /**
         * Public method
         * Prepare all cards and insert them into DOM
         * Before inserting new set of cards method will erase all previous cards
         * @param {Object} cards - array of card objects
         */
        this.generateCards = function(cards) {
            var templates = [];
            var preparedTemplate;

            // Prepare every card and push it to array
            cards.forEach(function (card) {
                preparedTemplate = prepareCardTemplate(card);
                templates.push(preparedTemplate);
            });

            // Shuffle card array
            templates = shuffleCards(templates);

            // Hide and empty card container
            $cardsContainer.hide().empty();

            // Append all cards to cards container
            templates.forEach(function(card) {
                $cardsContainer.append(card);
            });

            // Show card container
            $cardsContainer.fadeIn('slow');
        };

        /**
         * Public method
         * Attach click event on every card
         * Before inserting new set of cards method will erase all previous cards
         * @param {Function} func - function that will be invoked on card click
         */
        this.attachCardEvent = function(func) {
            $cardsContainer.unbind().on('click', '.flip-container', function() {
                func.call(this);
            });
        }
    }

})();

GAME20.Timer = (function() {

    var $timer = $('.timer');
    var $seconds = $timer.find('#seconds');
    var $minutes = $timer.find('#minutes');
    var $bestTimeContainer = $timer.find('.time');


    var minutes, seconds;

    function decorateNumber(value) {
        return value > 9 ? value : '0' + value;
    }

    return function() {
        var interval;
        var storage = new GAME20.Storage();

        this.startTimer = function() {
            var sec = 0;
            var bestTime;

            // Set timer interval
            interval = setInterval( function() {
                seconds = ++sec % 60;
                minutes = parseInt(sec / 60, 10);
                $seconds.html(decorateNumber(seconds));
                $minutes.html(decorateNumber(minutes));
            }, 1000);

            // Show timer
            $timer.delay(1000).fadeIn();

            this.updateBestTime();
        };

        this.updateBestTime = function() {
            // Check if user have saved best game time
            bestTime = storage.retrieveBestTime();
            if(bestTime != undefined && bestTime != '') {
                $bestTimeContainer
                    .find('#bestTime')
                    .text(bestTime.minutes + ':' + bestTime.seconds)
                    .end()
                    .fadeIn();
            }
        };

        this.stopTimer = function() {
            clearInterval(interval);
        };

        this.retrieveTime = function() {
            return {
                minutes: decorateNumber(minutes),
                seconds: decorateNumber(seconds)
            }
        };
    }
})();


GAME20.Storage = (function() {

    return function() {

        /**
         * Save best time to localStorage
         * key = 'bestTime'
         * @param {Object} time - object with keys: 'minutes', 'seconds'
         */
        this.setBestTime = function(time) {
            localStorage.setItem('bestTime', JSON.stringify(time));
        };

        /**
         * Retrieve best time from localStorage
         */
        this.retrieveBestTime = function() {
            return JSON.parse(localStorage.getItem('bestTime'));
        };

    }
})();



// Game init
$(function() {

        var game20 = new GAME20.Game({
            cards: [
                {
                    backImg: './img/01.png',
                    backTxt: '권기옥',
                    desc: '비행사·출판인·독립운동가',
                    connectionID: 1
                },
                {
                    backImg: './img/01.png',
                    backTxt: '권기옥',
                    desc: '비행사·출판인·독립운동가',
                    connectionID: 1
                },
                {
                    backImg: './img/02.png',
                    backTxt: '김명순',
                    desc: '소설가·시인',
                    connectionID: 2
                },
                {
                    backImg: './img/02.png',
                    backTxt: '김명순',
                    desc: '소설가·시인',
                    connectionID: 2
                },
                {
                    backImg: './img/03.png',
                    backTxt: '김점동',
                    desc: '의사',
                    connectionID: 3
                },
                {
                    backImg: './img/03.png',
                    backTxt: '김점동',
                    desc: '의사',
                    connectionID: 3
                },
                {
                    backImg: './img/04.png',
                    backTxt: '플로랑스 나이팅게일',
                    desc: '간호사·작가·통계학자',
                    connectionID: 4
                },
                {
                    backImg: './img/04.png',
                    backTxt: '플로랑스 나이팅게일',
                    desc: '간호사·작가·통계학자',
                    connectionID: 4
                },
                {
                    backImg: './img/05.png',
                    backTxt: '나혜석',
                    desc: '화가·소설가',
                    connectionID: 5
                },
                {
                    backImg: './img/05.png',
                    backTxt: '나혜석',
                    desc: '화가·소설가',
                    connectionID: 5
                },
                {
                    backImg: './img/06.png',
                    backTxt: '로자 파크스',
                    desc: '인권운동가',
                    connectionID: 6
                },
                {
                    backImg: './img/06.png',
                    backTxt: '로자 파크스',
                    desc: '인권운동가',
                    connectionID: 6
                },
                {
                    backImg: './img/07.png',
                    backTxt: '마리암 미르자하니',
                    desc: '수학자',
                    connectionID: 7
                },
                {
                    backImg: './img/07.png',
                    backTxt: '마리암 미르자하니',
                    desc: '수학자',
                    connectionID: 7
                },
                {
                    backImg: './img/08.png',
                    backTxt: '말랄라 유사프자이',
                    desc: '교육활동가',
                    connectionID: 8
                },
                {
                    backImg: './img/08.png',
                    backTxt: '말랄라 유사프자이',
                    desc: '교육활동가',
                    connectionID: 8
                },
                {
                    backImg: './img/09.png',
                    backTxt: '박남옥',
                    desc: '영화감독',
                    connectionID: 9
                },
                {
                    backImg: './img/09.png',
                    backTxt: '박남옥',
                    desc: '영화감독',
                    connectionID: 9
                },
                {
                    backImg: './img/10.png',
                    backTxt: '버지니아 울프',
                    desc: '작가',
                    connectionID: 10
                },
                {
                    backImg: './img/10.png',
                    backTxt: '버지니아 울프',
                    desc: '작가',
                    connectionID: 10
                },
                {
                    backImg: './img/11.png',
                    backTxt: '베르타 카세레스',
                    desc: '환경운동가',
                    connectionID: 11
                },
                {
                    backImg: './img/11.png',
                    backTxt: '베르타 카세레스',
                    desc: '환경운동가',
                    connectionID: 11
                },
                {
                    backImg: './img/12.png',
                    backTxt: '부춘화',
                    desc: '해녀·독립운동가',
                    connectionID: 12
                },
                {
                    backImg: './img/12.png',
                    backTxt: '부춘화',
                    desc: '해녀·독립운동가',
                    connectionID: 12
                },
                {
                    backImg: './img/13.png',
                    backTxt: '에멀린 팽크허스트',
                    desc: '사회운동가',
                    connectionID: 13
                },
                {
                    backImg: './img/13.png',
                    backTxt: '에멀린 팽크허스트',
                    desc: '사회운동가',
                    connectionID: 13
                },
                {
                    backImg: './img/14.png',
                    backTxt: '이태영',
                    desc: '변호사·여성운동가',
                    connectionID: 14
                },
                {
                    backImg: './img/14.png',
                    backTxt: '이태영',
                    desc: '변호사·여성운동가',
                    connectionID: 14
                },
                {
                    backImg: './img/15.png',
                    backTxt: '제인 구달',
                    desc: '동물행동학자·환경운동가',
                    connectionID: 15
                },
                {
                    backImg: './img/15.png',
                    backTxt: '제인 구달',
                    desc: '동물행동학자·환경운동가',
                    connectionID: 15
                },
                {
                    backImg: './img/16.png',
                    backTxt: '차미리사',
                    desc: '교육자·독립운동가·여성운동가',
                    connectionID: 16
                },
                {
                    backImg: './img/16.png',
                    backTxt: '차미리사',
                    desc: '교육자·독립운동가·여성운동가',
                    connectionID: 16
                },
                {
                    backImg: './img/17.png',
                    backTxt: '캐서린 존슨',
                    desc: '물리학자·수학자',
                    connectionID: 17
                },
                {
                    backImg: './img/17.png',
                    backTxt: '캐서린 존슨',
                    desc: '물리학자·수학자',
                    connectionID: 17
                },
                {
                    backImg: './img/18.png',
                    backTxt: '투유유',
                    desc: '중의학자·화학자',
                    connectionID: 18
                },
                {
                    backImg: './img/18.png',
                    backTxt: '투유유',
                    desc: '중의학자·화학자',
                    connectionID: 18
                },
                {
                    backImg: './img/19.png',
                    backTxt: '허정숙',
                    desc: '여성운동가·언론인',
                    connectionID: 19
                },
                {
                    backImg: './img/19.png',
                    backTxt: '허정숙',
                    desc: '여성운동가·언론인',
                    connectionID: 19
                },
                {
                    backImg: './img/20.png',
                    backTxt: '헬렌 켈러',
                    desc: '인권운동가·사회운동가·작가',
                    connectionID: 20
                },
                {
                    backImg: './img/20.png',
                    backTxt: '헬렌 켈러',
                    desc: '인권운동가·사회운동가·작가',
                    connectionID: 20
                },
            ]
        });

        $('#btn-start-game20').click(function() {
            game20.generateCardSet();
            $('#btn-start-game8').addClass('hide');
            $('#btn-start-game12').addClass('hide');
            $('#btn-start-game20').addClass('hide');
            $('#btn-refresh').removeClass('hide');
            $('#level-game20').removeClass('hide');
            $('.wrapper_btn').addClass('hide');
            $('.eng-title').addClass('hide');
            $('.footer').addClass('hide');
        });

    });






/*             // 이미지 정보 모달을 표시하는 함수
            function showImageInfo(card) {
                var modal = document.querySelector('.modal');
                var modalContent = document.querySelector('.modal-content');
                var closeBtn = document.querySelector('.close');
                var name = document.querySelector('.name');
                var year = document.querySelector('.year');
                var desc = document.querySelector('.desc');
                var quote = document.querySelector('.quote');

                name.innerText = card.backTxt;
                year.innerText = card.year;
                desc.innerText = card.desc;
                quote.innerText = card.quote;

                modal.style.display = 'block';
                
                
                
                

                // 모달 닫기 이벤트 추가
                closeBtn.addEventListener('click', function() {
                    modal.style.display = 'none';
                    startTimer();
                });

                // 모달 외부 클릭 시 닫기 이벤트 추가
                window.addEventListener('click', function(event) {
                    if (event.target == modal) {
                        modal.style.display = 'none';
                        startTimer();
                    }
                });
                
            } */


