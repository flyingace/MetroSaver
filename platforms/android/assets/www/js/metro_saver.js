/*global $, FastClick, window, document*/

var metro_saver = {

    calc_values: {
        minAdd: 100,
        maxAdd: 10000,
        minAddForBonus: 550,
        maxCardValue: 10000,
        costPerRide: 275,
        toAdd: 0,
        increment: 5,
        bonusRate: 5,
        currentBalance: '$00.00',
        visibleTab: ''
    },

    initialize: function () {
        this.bindEvents();
    },

    bindEvents: function () {
        var keypadButton = $('.keypad, .tab'),
            fareButton = $('.fare-menu li');

        keypadButton.bind('click', this.onKeypadClicked);
        fareButton.bind('click', this.onFareSelected);
        keypadButton.bind('touchStart', this.onTouchStart);

        //instantiate FastClick library
        if (!document.addEventListener) {
            document.addEventListener('DOMContentLoaded', function () {
                FastClick.attach(document.body);
            }, false);
        }
    },

    onKeypadClicked: function (evt) {
        //var inputFieldValue = document.getElementById('card-value-input').value,
        //    replacementValue = metro_saver.removeDollarAndDecimal(inputFieldValue),
        var cv = metro_saver.calc_values,
            currentBalance = cv.currentBalance,
            keyId = evt.target.id,
            keyValue = evt.target.value,
            resultsArray;

        switch (keyId) {
            case "keypad-go":
                resultsArray = metro_saver.calculate(currentBalance);
                metro_saver.updateResultsPanel(resultsArray);
                metro_saver.updatePanelVisibility('results');
                break;
            case "keypad-clear":
                metro_saver.clearField();
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
                metro_saver.updateFieldValue(currentBalance, keyValue);
                break;
        }
    },

    onBackButtonClicked: function () {
        metro_saver.updatePanelVisibility('input');
    },

    onTouchStart: function () {
        return true;
    },

    /**
     * Strips '$' and '.' out of 'valueToModify' and converts resulting string to an integer
     * @param valueToModify
     * @returns {Number}
     */
    removeDollarAndDecimal: function (valueToModify) {
        var strippedValue = valueToModify.replace(/(\$|\.)/g, ''),
            numericValue = parseInt(strippedValue, 10);

        return numericValue;
    },

    restoreDollarAndDecimal: function (valueToAmend) {
        var valueAsString = valueToAmend.toString(),
            dollars, cents, amendedValue;

        while (valueAsString.length < 3) {
            valueAsString = '0' + valueAsString;
        }

        dollars = valueAsString.slice(0, -2);
        cents = valueAsString.slice(-2);
        amendedValue = '$' + dollars + '.' + cents;

        return amendedValue;
    },

    clearField: function () {
        metro_saver.calc_values.currentBalance = '$00.00';
        document.getElementById('card-value-input').value = '$00.00';
    },

    updateFieldValue: function (currValue, keyPressed) {
        var currentValue = currValue,
            cv = metro_saver.calc_values,
            valuesArray = currentValue.split(''),
            updatedValue;

        if (keyPressed === 'del') {
            updatedValue = valuesArray[0] + '0' + valuesArray[1] + '.' + valuesArray[2] + valuesArray[4];
        } else if (valuesArray[1] === '0') {
            updatedValue = '$' + valuesArray[2] + valuesArray[4] + '.' + valuesArray[5] + keyPressed;
        } else {
            updatedValue = currentValue;
        }

        cv.currentBalance = updatedValue;
        document.getElementById('card-value-input').value = updatedValue;

    },

    updatePanelVisibility: function (panelName) {
        var appWrapper = document.getElementsByClassName('app-wrapper')[0];

        appWrapper.className = "app-wrapper " + panelName;
    },

    updateTabsVisibility: function (tabName) {
        var tabsPanel = document.getElementsByClassName('tabs-panel')[0],
            visibleTab = metro_saver.calc_values.visibleTab;

        if (tabName === visibleTab || tabName === '') {
            tabsPanel.className = 'panel tabs-panel tabs-hidden';
            metro_saver.calc_values.visibleTab = '';
        } else {
            tabsPanel.className = 'panel tabs-panel ' + tabName;
            metro_saver.calc_values.visibleTab = tabName;
        }
    },

    calculate: function () {
        var cv = metro_saver.calc_values,
            currentBalance = metro_saver.removeDollarAndDecimal(cv.currentBalance),
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
        while (toAdd < minAddForBonus) {
            projectedTotal = currentBalance + toAdd;

            if (projectedTotal > maxCardValue) {
                i = 0;
                return resultsArray;
            }

            if (projectedTotal % costPerRide === 0 && toAdd >= minAdd) {
                resultsArray.push([toAdd, projectedTotal - (currentBalance + toAdd), projectedTotal, projectedTotal / costPerRide]);
            }

            i += 1;
            toAdd = increment * i;
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
        var cv = metro_saver.calc_values,
            minAddForBonus = cv.minAddForBonus,
            resultsContainer = document.getElementById('results'),
            resultTable, noResultTable, resultArray, toAdd, bonusRate, bonus, totalValue,
            i;

        metro_saver.updateSummary(cv.currentBalance, cv.costPerRide);

        resultsContainer.innerText = '';

        for (i = 0; i < resultsArray.length; i++) {
            resultArray = resultsArray[i];
            toAdd = metro_saver.restoreDollarAndDecimal(resultArray[0]);
            bonusRate = (resultArray[0] >= minAddForBonus) ? cv.bonusRate.toString() : '0';
            bonus = metro_saver.restoreDollarAndDecimal(resultArray[1]);
            totalValue = metro_saver.restoreDollarAndDecimal(resultArray[2]);

            resultTable = '<div class="result-table">' +
                '<div class="add label">Add to Your Card:</div>' +
                '<div class="add amount">' + toAdd + '</div>' +
                '<div class="ride-count">' +
                '<span class="count">' + resultArray[3] + '</span>' +
                '<span class="rides">Rides</span>' +
                '</div>' +
                '<div class="bonus label">' + bonusRate + '% Bonus:</div>' +
                '<div class="bonus amount">' + bonus + '</div>' +
                '<div class="total label">Total Value: </div>' +
                '<div class="total amount">' + totalValue + '</div>' +
                '</div>';
            resultsContainer.insertAdjacentHTML('beforeend', resultTable);
        }

        if (resultsContainer.innerText === '') {
            noResultTable = '<div class="no-result-table">' +
                '<h2>No Results</h2>' +
                '<p>Sorry! MetroSaver could not provide any results given your current balance and the fare you have selected. ' +
                'To better understand why this might be, please tap the <strong>More&nbsp;Info</strong> tab below.</p>' +
                '</div>';

            resultsContainer.insertAdjacentHTML('afterbegin', noResultTable);
        }
    },

    updateSummary: function (currBalance, _rideCost) {
        var summaryBar = document.getElementById('summary-bar'),
            rideCost = metro_saver.restoreDollarAndDecimal(_rideCost),
            summaryText = '<span class="balance-field"><span>Current Balance:</span> ' + currBalance + '</span><span class="fare-field"><span>Selected Fare:</span> ' + rideCost + '</span>';

        summaryBar.innerText = '';
        summaryBar.insertAdjacentHTML('afterbegin', summaryText);
    },

    onFareSelected: function (evt) {
        var selectedFare = evt.target,
            fareButtons = document.querySelectorAll('ul.fare-menu li'),
            cv = metro_saver.calc_values,
            currBalance = metro_saver.removeDollarAndDecimal(cv.currentBalance),
            resultsArray,
            i;

        if (selectedFare.className.indexOf('selected') === -1) {
            //forEach cannot be used here b/c this is not an array but a nodeList
            for (i = 0; i < fareButtons.length; i++) {
                fareButtons[i].className = 'fare';
            }
            selectedFare.className += ' selected';
            cv.costPerRide = parseInt(selectedFare.value, 10);

            resultsArray = metro_saver.calculate(currBalance);
            metro_saver.updateResultsPanel(resultsArray);
        }

        window.setTimeout(function () {
            metro_saver.updateTabsVisibility('');
        }, 300);
    }
};

metro_saver.initialize();