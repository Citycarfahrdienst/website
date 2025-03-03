# Economic Calendar

A modern web application that displays economic events from the FXStreet API with filtering capabilities and date selection.

## Features

- Displays economic events with detailed information (time, country, event name, actual values, forecasts, previous values, and volatility)
- Select custom date ranges to view past or future economic events
- Filter events by country and volatility level
- Visual indicators for event volatility and performance against expectations
- Responsive design for desktop and mobile devices
- Direct API access using curl commands for reliable data fetching

## Setup and Installation

1. Clone this repository or download the files
2. Install Node.js if you haven't already (https://nodejs.org/)
3. Open a terminal in the project directory
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the server:
   ```bash
   npm start
   ```
6. Open your web browser and navigate to `http://localhost:3000`

## How to Use

1. The application will automatically fetch and display the economic calendar data for a default date range (yesterday to tomorrow)
2. Use the date pickers at the top to select your desired date range and click "Fetch Data"
3. Use the filters to narrow down events by country or volatility

## Date Selection

The application allows you to:
- View economic data for any date range
- Defaults to showing yesterday through tomorrow
- Select start and end dates using the date picker inputs
- Click "Fetch Data" to load events for the selected date range

## API Implementation

The application now uses a direct curl-based approach to fetch data from the FXStreet API. This implementation:

1. Sends requests through a Node.js server that executes curl commands
2. Includes all necessary headers for proper API authentication
3. Handles gzip compression and proper data parsing
4. Provides detailed error reporting for troubleshooting

When the API returns an error, the application will generate sample data for your selected date range, allowing you to see how the calendar would look with real data.

## Troubleshooting API Issues

If you encounter errors, here are some possible reasons:

1. **Server Not Running**: Make sure you've started the Node.js server using `npm start`
2. **Port Conflict**: If port 3000 is in use, modify the port in `server.js`
3. **Curl Not Installed**: Ensure curl is installed on your system
4. **API Changes**: The FXStreet API endpoint structure or authentication requirements may have changed
5. **Network Issues**: Check your firewall settings and network connectivity

## Credits

This application uses:
- [Font Awesome](https://fontawesome.com/) for icons
- [Flag CDN](https://flagcdn.com/) for country flag images
- [Express](https://expressjs.com/) for the server implementation
- FXStreet API for economic calendar data

## License

MIT License 