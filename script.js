document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const calendarData = document.getElementById('calendar-data');
    const loader = document.getElementById('loader');
    const noData = document.getElementById('no-data');
    const currentDateRange = document.getElementById('current-date-range');
    const countryFilter = document.getElementById('country-filter');
    const volatilityFilter = document.getElementById('volatility-filter');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const fetchDataButton = document.getElementById('fetch-data');

    // Store all events data
    let allEvents = [];
    let countries = new Set();

    // Initialize date inputs with default values
    const initializeDateInputs = () => {
        // Set default start date to yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Set default end date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Format dates for input elements (YYYY-MM-DD)
        startDateInput.value = formatDateForInput(yesterday);
        endDateInput.value = formatDateForInput(tomorrow);
    };

    // Format date for input elements
    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Convert local date to UTC ISO string with time
    const toUTCIsoString = (dateStr, isEndDate = false) => {
        const date = new Date(dateStr);
        if (isEndDate) {
            // End date should be at 23:59:59
            date.setHours(23, 59, 59, 999);
        } else {
            // Start date should be at 00:00:00
            date.setHours(0, 0, 0, 0);
        }
        return date.toISOString();
    };

    // Format date for display
    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return new Date(dateString).toLocaleString('en-US', options);
    };

    // Format time only
    const formatTime = (dateString) => {
        const options = { 
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return new Date(dateString).toLocaleString('en-US', options);
    };

    // Get country flag URL
    const getCountryFlag = (countryCode) => {
        return `https://flagcdn.com/16x12/${countryCode.toLowerCase()}.png`;
    };

    // Get full country name
    const getCountryName = (countryCode) => {
        const countryNames = {
            'US': 'United States',
            'UK': 'United Kingdom',
            'EMU': 'Eurozone',
            'DE': 'Germany',
            'CN': 'China',
            'JP': 'Japan',
            'CA': 'Canada',
            'AU': 'Australia',
            'NZ': 'New Zealand',
            'CH': 'Switzerland',
            'FR': 'France',
            'IT': 'Italy',
            'ES': 'Spain',
            'UA': 'Ukraine'
        };
        return countryNames[countryCode] || countryCode;
    };

    // Format number with unit
    const formatValue = (value, unit) => {
        if (value === null || value === undefined) return '-';
        
        // Add thousands separator
        const formattedValue = value.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 3
        });
        
        return unit ? `${formattedValue} ${unit}` : formattedValue;
    };

    // Determine value class based on expected/actual comparison
    const getValueClass = (event) => {
        if (event.isBetterThanExpected === true) return 'better-than-expected';
        if (event.isBetterThanExpected === false) return 'worse-than-expected';
        return '';
    };

    // Show success alert when data is fetched successfully
    const showSuccessAlert = () => {
        // Alert user that the CORS proxy is working
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-success';
        alertElement.innerHTML = `<p>Successfully fetched data using CORS proxy!</p>`;
        
        // Remove any existing alert first
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        document.querySelector('.container').insertBefore(alertElement, document.querySelector('.calendar-container'));
        
        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            alertElement.style.opacity = '0';
            setTimeout(() => alertElement.remove(), 1000);
        }, 5000);
    };

    // Fetch economic calendar data
    const fetchCalendarData = async () => {
        try {
            showLoader();
            
            // Get dates from inputs
            const startDate = toUTCIsoString(startDateInput.value);
            const endDate = toUTCIsoString(endDateInput.value, true);
            
            // Display date range
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            currentDateRange.textContent = `${startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            
            // Call Netlify function to fetch calendar data
            const calendarResponse = await fetch('/.netlify/functions/fetch-calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ startDate, endDate })
            });

            if (!calendarResponse.ok) {
                throw new Error(`Failed to fetch calendar data: ${calendarResponse.status}`);
            }

            const calendarData = await calendarResponse.json();
            
            // Show success alert only if we got valid data
            if (Array.isArray(calendarData) && calendarData.length > 0) {
                showSuccessAlert();
            }
            
            // Store all events
            allEvents = calendarData;
            
            // Extract unique countries for filter
            countries = new Set(calendarData.map(event => event.countryCode));
            populateCountryFilter();
            
            // Display the data
            renderCalendarData(calendarData);
            
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            hideLoader();
            
            // Use sample data even in case of network errors
            const sampleData = generateSampleData(toUTCIsoString(startDateInput.value), toUTCIsoString(endDateInput.value, true));
            allEvents = sampleData;
            countries = new Set(sampleData.map(event => event.countryCode));
            populateCountryFilter();
            renderCalendarData(sampleData);
            
            // Show error message
            const alertElement = document.createElement('div');
            alertElement.className = 'alert';
            alertElement.innerHTML = `<p>Error fetching data from API (${error.message}). Showing sample data for demonstration.</p>`;
            
            // Remove any existing alert first
            const existingAlert = document.querySelector('.alert');
            if (existingAlert) {
                existingAlert.remove();
            }
            
            document.querySelector('.container').insertBefore(alertElement, document.querySelector('.calendar-container'));
            
            // Auto-remove alert after 7 seconds
            setTimeout(() => {
                alertElement.style.opacity = '0';
                setTimeout(() => alertElement.remove(), 1000);
            }, 7000);
        }
    };
    
    // Generate sample data based on the date range
    const generateSampleData = (startDate, endDate) => {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const sampleData = [];
        
        // Calculate number of days in the date range
        const dayDiff = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));
        
        // Sample event templates
        const eventTemplates = [
            {
                name: "GDP Growth Rate (QoQ)",
                countryCode: "US",
                currencyCode: "USD",
                unit: "%",
                volatility: "HIGH",
                potency: "HIGH",
                consensus: 0.7,
                previous: 0.5,
                timeOffset: 12 // Hours from midnight
            },
            {
                name: "Unemployment Rate",
                countryCode: "DE",
                currencyCode: "EUR",
                unit: "%",
                volatility: "MEDIUM",
                potency: "MEDIUM",
                consensus: 5.2,
                previous: 5.4,
                timeOffset: 9 // Hours from midnight
            },
            {
                name: "Inflation Rate (YoY)",
                countryCode: "UK",
                currencyCode: "GBP",
                unit: "%",
                volatility: "HIGH",
                potency: "HIGH",
                consensus: 2.1,
                previous: 2.3,
                timeOffset: 10 // Hours from midnight
            },
            {
                name: "Retail Sales (MoM)",
                countryCode: "JP",
                currencyCode: "JPY",
                unit: "%",
                volatility: "MEDIUM",
                potency: "MEDIUM",
                consensus: 0.3,
                previous: -0.2,
                timeOffset: 6 // Hours from midnight
            },
            {
                name: "Interest Rate Decision",
                countryCode: "AU",
                currencyCode: "AUD",
                unit: "%",
                volatility: "HIGH",
                potency: "HIGH",
                consensus: 4.25,
                previous: 4.25,
                timeOffset: 3 // Hours from midnight
            },
            {
                name: "Industrial Production (MoM)",
                countryCode: "CN",
                currencyCode: "CNY",
                unit: "%",
                volatility: "LOW",
                potency: "MEDIUM",
                consensus: 0.5,
                previous: 0.4,
                timeOffset: 8 // Hours from midnight
            },
            {
                name: "Consumer Confidence",
                countryCode: "FR",
                currencyCode: "EUR",
                unit: "points",
                volatility: "LOW",
                potency: "LOW",
                consensus: 96.5,
                previous: 95.2,
                timeOffset: 11 // Hours from midnight
            },
            {
                name: "Trade Balance",
                countryCode: "CA",
                currencyCode: "CAD",
                unit: "B",
                volatility: "MEDIUM",
                potency: "MEDIUM",
                consensus: -1.5,
                previous: -2.1,
                timeOffset: 14 // Hours from midnight
            }
        ];
        
        // Generate events for each day in the range
        for (let i = 0; i < dayDiff; i++) {
            const currentDate = new Date(startDateObj);
            currentDate.setDate(startDateObj.getDate() + i);
            
            // Add 2-4 events per day
            const eventsPerDay = Math.floor(Math.random() * 3) + 2;
            
            for (let j = 0; j < eventsPerDay; j++) {
                // Pick a random event template
                const templateIndex = Math.floor(Math.random() * eventTemplates.length);
                const template = eventTemplates[templateIndex];
                
                // Generate random actual value around consensus
                const actualValueVariance = (Math.random() * 0.8) - 0.4; // -0.4 to +0.4
                const actual = template.consensus + actualValueVariance;
                
                // Determine if better than expected
                const isBetterThan = actual > template.consensus ? 
                    // For some metrics like unemployment, lower is better
                    (template.name.includes('Unemployment') ? false : true) : 
                    (template.name.includes('Unemployment') ? true : false);
                
                // Create UTC date for the event
                const eventDate = new Date(currentDate);
                eventDate.setHours(template.timeOffset, Math.floor(Math.random() * 60), 0, 0);
                
                // Create the event object
                const event = {
                    id: `sample-${i}-${j}-${Date.now()}`,
                    eventId: `template-${templateIndex}`,
                    dateUtc: eventDate.toISOString(),
                    periodDateUtc: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
                    periodType: "MONTH",
                    actual: parseFloat(actual.toFixed(3)),
                    revised: null,
                    consensus: template.consensus,
                    ratioDeviation: null,
                    previous: template.previous,
                    isBetterThanExpected: isBetterThan,
                    name: template.name,
                    countryCode: template.countryCode,
                    currencyCode: template.currencyCode,
                    unit: template.unit,
                    potency: template.potency,
                    volatility: template.volatility,
                    isAllDay: false,
                    isTentative: false,
                    isPreliminary: false,
                    isReport: false,
                    isSpeech: false,
                    lastUpdated: Math.floor(Date.now() / 1000),
                    previousIsPreliminary: false,
                    categoryId: "33303f5e-1e3c-4016-ab2d-ac87e98f57ca"
                };
                
                sampleData.push(event);
            }
        }
        
        return sampleData;
    };

    // Populate country filter options
    const populateCountryFilter = () => {
        // Clear existing options (except "All")
        while (countryFilter.options.length > 1) {
            countryFilter.remove(1);
        }
        
        // Add options for each country
        countries.forEach(countryCode => {
            const option = document.createElement('option');
            option.value = countryCode;
            option.textContent = getCountryName(countryCode);
            countryFilter.appendChild(option);
        });
    };

    // Filter events based on selected criteria
    const filterEvents = () => {
        const selectedCountry = countryFilter.value;
        const selectedVolatility = volatilityFilter.value;
        
        let filteredEvents = [...allEvents];
        
        // Apply country filter
        if (selectedCountry !== 'all') {
            filteredEvents = filteredEvents.filter(event => event.countryCode === selectedCountry);
        }
        
        // Apply volatility filter
        if (selectedVolatility !== 'all') {
            filteredEvents = filteredEvents.filter(event => event.volatility === selectedVolatility);
        }
        
        // Display filtered results
        renderCalendarData(filteredEvents);
    };

    // Render calendar data to the table
    const renderCalendarData = async (events) => {
        hideLoader();
        
        // Clear previous data
        calendarData.innerHTML = '';
        
        if (events.length === 0) {
            noData.classList.remove('hidden');
            return;
        }
        
        noData.classList.add('hidden');
        
        // Sort events by date
        events.sort((a, b) => new Date(a.dateUtc) - new Date(b.dateUtc));
        
        // Group by date
        const eventsByDate = {};
        events.forEach(event => {
            const date = new Date(event.dateUtc).toLocaleDateString();
            if (!eventsByDate[date]) {
                eventsByDate[date] = [];
            }
            eventsByDate[date].push(event);
        });
        
        // Render events grouped by date
        for (const date of Object.keys(eventsByDate)) {
            // Add date header
            const dateRow = document.createElement('tr');
            dateRow.className = 'date-header';
            dateRow.innerHTML = `
                <td colspan="8" class="date-header-cell">
                    <strong>${new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                </td>
            `;
            calendarData.appendChild(dateRow);
            
            // Add events for this date
            for (const event of eventsByDate[date]) {
                // Get Gemini analysis for the event
                let recommendation = 'ANALYZING...';
                try {
                    const analysisResponse = await fetch('/.netlify/functions/analyze-event', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ event })
                    });
                    
                    if (analysisResponse.ok) {
                        const analysisData = await analysisResponse.json();
                        recommendation = analysisData.recommendation;
                    } else {
                        recommendation = 'ERROR';
                    }
                } catch (error) {
                    console.error('Error getting Gemini analysis:', error);
                    recommendation = 'ERROR';
                }
                
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${formatTime(event.dateUtc)}</td>
                    <td class="country">
                        <img class="country-flag" src="${getCountryFlag(event.countryCode)}" alt="${event.countryCode}">
                        ${getCountryName(event.countryCode)}
                    </td>
                    <td>${event.name}</td>
                    <td class="${getValueClass(event)}">${formatValue(event.actual, event.unit)}</td>
                    <td>${formatValue(event.consensus, event.unit)}</td>
                    <td>${formatValue(event.previous, event.unit)}</td>
                    <td>
                        <span class="volatility volatility-${event.volatility}">${event.volatility.toLowerCase()}</span>
                    </td>
                    <td>
                        <span class="recommendation recommendation-${recommendation.toLowerCase()}">${recommendation}</span>
                    </td>
                `;
                
                calendarData.appendChild(row);
            }
        }
    };

    // Show loader
    const showLoader = () => {
        loader.classList.remove('hidden');
        noData.classList.add('hidden');
    };

    // Hide loader
    const hideLoader = () => {
        loader.classList.add('hidden');
    };

    // Add event listeners for filters
    countryFilter.addEventListener('change', filterEvents);
    volatilityFilter.addEventListener('change', filterEvents);
    fetchDataButton.addEventListener('click', fetchCalendarData);

    // Initialize date inputs
    initializeDateInputs();
    
    // Initialize: fetch the data
    fetchCalendarData();
}); 