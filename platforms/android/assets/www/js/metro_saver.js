/*global $, jQuery, alert*/

var metro_saver = {

    calc_values: {
        'minAdd': 5,
        'maxAdd': 10000,
        'minAddForBonus': 550,
        'maxCardValue': 10000,
        'costPerRide': 275,
        'toAdd': 0,
        'increment': 5,
        'bonusRate': 11,
        'currentBalance': '$00.00'
    },

    initialize: function () {
        this.bindEvents();
    },

    bindEvents: function () {
        var keypadButton = $('.keypad, .tab'),
            fareButton = $('.fare-menu li');

        keypadButton.bind('click', this.onKeypadClicked);
        fareButton.bind('click', this.onFareSelected);
    },

    onKeypadClicked: function (evt) {
        //var inputFieldValue = document.getElementById('card-value-input').value,
        //    replacementValue = metro_saver.removeDollarAndDecimal(inputFieldValue),
        var cv = metro_saver.calc_values,
            replacementValue = metro_saver.removeDollarAndDecimal(cv.currentBalance),
            keyId = evt.target.id,
            keyValue = evt.target.value,
            resultsArray;

        switch (keyId) {
            case "keypad-go":
                resultsArray = metro_saver.calculate(replacementValue);
                metro_saver.updateResultsPanel(resultsArray);
                metro_saver.updatePanelVisibility('results');
                break;
            case "keypad-del":
                //reverse process of adding numbers
                break;
            case "keypad-clear":
                metro_saver.updateFieldValue(0, 0);
                //clear
                break;
            case "keypad-back":
                metro_saver.onBackButtonClicked();
                break;
            case "tab-settings":
                metro_saver.updateTabsVisibility('settings-visible');
                break;
            case "tab-info":
                metro_saver.updateTabsVisibility('info-visible');
                break;
            default:
                metro_saver.updateFieldValue(replacementValue, keyValue);
                break;
        }
    },

    onBackButtonClicked: function (evt) {
        metro_saver.updatePanelVisibility('input');
    },

    /**
     * Strips string value of 'valueToModify' of '$' and converts resulting string
     * to a float, then multiplies that by 100 and returns a Number
     * @param valueToModify
     * @returns {*}
     */
    removeDollarAndDecimal: function (valueToModify) {
        var modifiedValue = valueToModify.toString();

        if (modifiedValue.indexOf('$') === 0) {
            modifiedValue = modifiedValue.slice(1);
        }

        if (modifiedValue.indexOf('.') !== -1) {
            modifiedValue = Math.floor(parseFloat(modifiedValue) * 100);
        }

        return modifiedValue;
    },

    restoreDollarAndDecimal: function (valueToAmend) {
        var valueAsString = valueToAmend.toString(),
            amendedValue, dollars, cents;

        if (valueAsString.length < 3) {
            valueAsString = '0'.concat(valueAsString);
        }

        dollars = valueAsString.slice(0, -2);
        cents = valueAsString.slice(-2);
        amendedValue = '$'.concat(dollars, '.', cents);

        return amendedValue;
    },


    updateFieldValue: function (prevValue, numberKeyPressed) {
        var previousValue = prevValue.toString(),
            cv = metro_saver.calc_values,
            updatedValue;

        if (previousValue.length < 4) {

            updatedValue = previousValue + numberKeyPressed;

            while (updatedValue.length < 4) {
                updatedValue = "0" + updatedValue;
            }

            updatedValue = "$" + updatedValue.substr(0, 2) + "." + updatedValue.substr(2); //TODO: Replace this with restoreDollarAndDecimal()

            cv.currentBalance = updatedValue;
            document.getElementById('card-value-input').value = updatedValue;
        }
    },

    updatePanelVisibility: function (panelName) {
        var appWrapper = document.getElementsByClassName('app-wrapper')[0];

        appWrapper.className = "app-wrapper " + panelName;
    },

    updateTabsVisibility: function (tabName) {
        var tabsPanel = document.getElementsByClassName('tabs-panel')[0];

        if (tabName.indexOf('visible') > -1) {
            tabsPanel.className = 'panel tabs-panel ' + tabName;
        } else {
            tabsPanel.className = 'panel tabs-panel tabs-hidden';
        }

    },

    calculate: function (currentBalance) {
        var cv = metro_saver.calc_values,
            minAdd = cv.minAdd,
            maxAdd = cv.maxAdd,
            minAddForBonus = cv.minAddForBonus,
            maxCardValue = cv.maxCardValue,
            costPerRide = cv.costPerRide,
            toAdd = cv.toAdd,
            increment = cv.increment,
            bonusRate = cv.bonusRate,
            resultsArray = [],
            projectedTotal,
            i = 0;

        //handle values too low for interest
        while (toAdd < maxAdd && toAdd < minAddForBonus) {
            i += 1;
            toAdd = increment * i;
            projectedTotal = currentBalance + toAdd;

            if (projectedTotal > maxCardValue) {
                i = 0;
                return resultsArray;
            }

            if (projectedTotal % costPerRide === 0 && toAdd >= minAdd) {
                resultsArray.push([toAdd, projectedTotal - (currentBalance + toAdd), projectedTotal, projectedTotal / costPerRide]);
            }
        }
        //handle values high enough for interest
        while (toAdd < maxAdd) {
            i += 1;
            toAdd = (increment * i) + minAddForBonus;
            projectedTotal = Math.round(currentBalance + toAdd + (toAdd / (100 / bonusRate)));

            if (projectedTotal > maxCardValue) {
                return resultsArray;
            }

            if ((projectedTotal % costPerRide) === 0) {
                resultsArray.push([toAdd, projectedTotal - (currentBalance + toAdd), projectedTotal, projectedTotal / costPerRide]);
            }
        }

        //console.log(resultsArray);
        return resultsArray;
    },

    updateResultsPanel: function (resultsArray) {
        var resultsContainer = document.getElementById('results'),
            resultTable, resultArray, toAdd, bonus, totalValue;

        resultsContainer.innerText = "";

        for (var i = 0; i < resultsArray.length; i++) {
            resultArray = resultsArray[i];
            toAdd = metro_saver.restoreDollarAndDecimal(resultArray[0]);
            bonus = metro_saver.restoreDollarAndDecimal(resultArray[1]);
            totalValue = metro_saver.restoreDollarAndDecimal(resultArray[2]);
            resultTable = '<div class="result-table">' +
                '<div class="add label">Add to Your Card:</div>' +
                '<div class="add amount">' + toAdd + '</div>' +
                '<div class="ride-count">' +
                '<span class="count">' + resultArray[3] + '</span>' +
                '<span class="rides">Rides</span>' +
                '</div>' +
                '<div class="bonus label">11% Bonus:</div>' +
                '<div class="bonus amount">' + bonus + '</div>' +
                '<div class="total label">Total Value: </div>' +
                '<div class="total amount">' + totalValue + '</div>' +
                '</div>';
            resultsContainer.insertAdjacentHTML('beforeEnd', resultTable);
        }
    },

    onFareSelected: function (evt) {
        var selectedFare = evt.target,
            fareButtons = document.querySelectorAll('ul.fare-menu li'),
            cv = metro_saver.calc_values,
            currBalance = metro_saver.removeDollarAndDecimal(cv.currentBalance);

        if (selectedFare.className.indexOf('selected') === -1) {
            //forEach cannot be used here b/c this is not an array but a nodeList
            for (var i = 0; i < fareButtons.length; i++) {
                fareButtons[i].className = 'fare';
            }
            selectedFare.className += ' selected';
            cv.costPerRide = parseInt(selectedFare.value);
//             metro_saver.updatePanelVisibility('input-panel');
            
            resultsArray = metro_saver.calculate(currBalance);
            metro_saver.updateResultsPanel(resultsArray);
        }

        setTimeout(function () {
            metro_saver.updateTabsVisibility('');
        }, 300);
    }
};

metro_saver.initialize();