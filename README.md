# Ragul Agency Travel Booking Demo

A responsive bus and train booking demo built with Express, Bootstrap, and browser session storage.

## Run locally

1. Install dependencies with `npm install`.
2. Start the app with `npm start`.
3. Open `http://localhost:5000`.

If you use VS Code Live Server (for example, `http://127.0.0.1:5500`) to serve the `public` folder, keep the Express server running with `npm start` as well. The frontend automatically sends API requests to port 5000 on the same local host in that setup.

On Vercel, API requests are handled by the catch-all function in `api/[...path].js`, which reuses the Express routes in `server.js`.

## Booking flow

- Sign in with a name and 10-digit mobile number. The app generates an OTP and displays it on screen for this demo; enter that code to continue.
- Search sample bus or train listings between Tamil Nadu cities by route and date. Filter by departure time, seat type, and AC/non-AC.
- Choose available seats and boarding/drop-off points, then review the ticket.
- The QR code is generated locally and contains sample booking data only. **Payment is simulated; this demo does not process payments or reserve real seats.**
- Choose **Download ticket PDF** and save the print dialog output as a PDF.

Login and booking information are kept in `sessionStorage` for the current browser tab and are cleared when you log out or close the tab. The demo OTP is displayed in the browser and verified there, so this flow does not provide production authentication.
