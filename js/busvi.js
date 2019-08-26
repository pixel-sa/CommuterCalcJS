(function () {
    'use strict';
    console.log("Whats up from Busvi script!");

    // var baseUrl = "https://www.fueleconomy.gov/ws/rest/vehicle/menu/";
    // var query = "year";
    //
    // var queryUrl = baseUrl + query;

    // $.ajax({
    //     url: queryUrl,
    //     headers: {
    //         Accept: 'application/json'
    //     }
    // }).done(function(data) {
    //     console.log(data);
    //
    // }).fail(function(data){
    //     alert("Try again champ!");
    // });

    var currentGasPrice;

    getGasPrice().then(function (response) {
        console.log(response);
        currentGasPrice = parseFloat(response.regular);
        console.log(currentGasPrice);
    });


    makeSelectQuery("year").then(function (data) {
        $.each(data.menuItem, function (i, yearData ) {
            $('#yearSelect')
                .append($('<option>', { value : yearData.text })
                    .text(yearData.text));
        });
    });

    $('#yearSelect').on('change', function() {
        console.log( this.value );
        var selectedYear = this.value;
        var queryString = 'make?year=' + selectedYear
        // $("#makeSelectDiv").hide();

        makeSelectQuery(queryString).then(function (data) {
            console.log(data);
            var html = '';
            html +='<label for="makeSelect">Select Make</label>';
            html += '<select class="form-control" id="makeSelect">';
            html += ' <option value="">Select Make</option>';

            $.each(data.menuItem, function(i, makeData){
                html += '<option value="' + makeData.text + '">' + makeData.text + '</option>';
            })
            html += '</select>';

            $("#vehicleSelectDiv").empty();
            $("#optionsSelectDiv").empty();
            $("#makeSelectDiv").empty().append(html);

            // $("#makeSelect").on('change', function () {
            //     console.log(this.value);
            // })
        })
    });


    $(document).on('change', '#makeSelect', function () {
        console.log(this.value);
        var selectedYear = $("#yearSelect").val();
        var selectedMake = this.value;

        console.log("*********************** in make select chnge")
        console.log(selectedYear)
        console.log(selectedMake)

        var queryString = 'model?year=' + selectedYear + '&make=' + selectedMake;
        console.log(queryString);


        makeSelectQuery(queryString).then(function (data) {
            console.log(data);

            var html = '';
            html += '<label for="modelSelect">Select Model</label>';
            html += '<select class="form-control" id="modelSelect">';
            html += ' <option value="">Select Model</option>';

            if(Array.isArray(data.menuItem)){

                $.each(data.menuItem, function (i, modelData) {
                    html += '<option value="' + modelData.text + '">' + modelData.text + '</option>';
                });

            } else {
                html += '<option value="' + data.menuItem.text + '">' + data.menuItem.text + '</option>';
            }

            html += '</select>';

            $("#vehicleSelectDiv").empty().append(html);
        });
    });

    $(document).on('change', '#modelSelect', function () {
        console.log("*********************** in model select change **********************")

        var selectedYear = $("#yearSelect").val();
        var selectedMake = $("#makeSelect").val();
        var selectedModel = this.value;

        var queryString = 'options?year=' + selectedYear + '&make=' + selectedMake + '&model=' + selectedModel;
        console.log(queryString);

        makeSelectQuery(queryString).then(function (data) {
            console.log(data);
           if(data.menuItem.length){
               var html = '';
               html += '<label for="modelSelect">Select Options</label>';
               html += '<select class="form-control" id="optionsSelect">';
               html += ' <option value="">Select Options</option>';

               $.each(data.menuItem, function (i, modelData) {
                   html += '<option value="' + modelData.value + '">' + modelData.text + '</option>';
               });

               html += '</select>';
               $("#optionsSelectDiv").empty().append(html);

           } else {
               $("#optionsSelectDiv").html("");
               console.log("no length");
               console.log(data.menuItem.text);
               console.log(data.menuItem.value);
               var vehicleId = data.menuItem.value;

               getVehicleInformation(vehicleId).then(function (data) {
                   var vehicleData = data;
               });
           }
        });

    });

    $(document).on('change', '#optionsSelect', function () {
        console.log("*********************** in model select change **********************")

        var selectedYear = $("#yearSelect").val();
        var selectedMake = $("#makeSelect").val();
        var selectedModel = $("#modelSelect").val();
        var selectedOption = this.value;

        getVehicleInformation(selectedOption).then(function (data) {
            var vehicleData = data;
            console.log(vehicleData);
            var mpg = parseFloat(vehicleData.comb08);
            console.log(mpg);
            var currentCostPerMile = (currentGasPrice / mpg).toFixed(2);

            var html = "<h4>" + selectedYear + " " + selectedMake + " " + selectedModel + "</h4>"
            html += "<p>Current Cost Per Mile: $" + currentCostPerMile + "</p>"

            $("#main").html(html);
            $("#addressInputs").show();
        });


    });

    function getVehicleInformation(vehicleId) {

        var query = "https://www.fueleconomy.gov/ws/rest/vehicle/" + vehicleId;

        return fetch( query, {
            headers: {'Accept': 'application/json'}
        })
        .then(function (res) {
            return res.json();
        }).then(function (data) {
            return data
        });
    }
    /***
     * makeSelectQuery is a method to retrieve all vehicle year values
     * @param {string} query is an object with properties "lat" and "lng" for latitude and longitude
     * @returns {Promise} a promise containing the all vehicle production years
     *
     * EXAMPLE:
     *
     *  makeSelectQuery(QUERY_HERE).then(function(results) {
     *      // do something with results
     *  })
     *
     */

    function makeSelectQuery(query) {
        var baseUrl = "https://www.fueleconomy.gov/ws/rest/vehicle/menu/";

        return fetch(baseUrl + query, {
            headers: {'Accept': 'application/json'}
            })
            .then(function(res) {
                return res.json();
            }).then(function(data) {
                return data
            });
    }


    function getGasPrice(){
        return fetch('https://www.fueleconomy.gov/ws/rest/fuelprices', {
            headers: {
                Accept: 'application/json'
            }
        })
        .then(function(res){
            return res.json();
        })
        .then(function(data) {
            if (data) {
                return data;
            } else {
                return null;
            }
        });
    }


    function initialize() {

        var input = document.getElementById('startingLocation');
        var autocomplete = new google.maps.places.Autocomplete(input);

        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                // User entered the name of a Place that was not suggested and
                // pressed the Enter key, or the Place Details request failed.
                window.alert("No details available for input: '" + place.name + "'");
                return;
            }
            console.log(place);
        });

        var endingInput = document.getElementById('endingLocation');
        var endingAutocomplete = new google.maps.places.Autocomplete(endingInput);

        endingAutocomplete.addListener('place_changed', function() {
            var endingPlace = autocomplete.getPlace();
            if (!endingPlace.geometry) {
                // User entered the name of a Place that was not suggested and
                // pressed the Enter key, or the Place Details request failed.
                window.alert("No details available for input: '" + endingPlace.name + "'");
                return;
            }
            console.log(endingPlace);
        });


    }

    google.maps.event.addDomListener(window, 'load', initialize);


})();