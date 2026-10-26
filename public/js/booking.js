document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    if (!searchForm) return;

    const searchMessage = document.getElementById('searchMessage');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultCount = document.getElementById('resultCount');
    const seatSection = document.getElementById('seatSection');
    const ticketSection = document.getElementById('ticketSection');
    const loader = document.getElementById('journeyLoader');
    const searchButton = document.getElementById('searchButton');
    const searchSpinner = document.getElementById('searchSpinner');
    const travelDate = document.getElementById('travelDate');
    const state = { trip: null, selectedTrip: null, selectedSeats: new Set(), booking: null };
    const apiUrl = path => `${window.WAYFARER_API_BASE || ''}${path}`;

    const today = new Date();
    travelDate.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    travelDate.value = travelDate.min;

    const sampleTrips = {
        Bus: [
            { name: 'Greenline Travels', time: '05:30', arrival: '12:15', duration: '6h 45m', price: 780, seatType: 'Sleeper', comfort: 'AC', rating: '4.7', seats: 11 },
            { name: 'CityLink Express', time: '08:10', arrival: '15:20', duration: '7h 10m', price: 540, seatType: 'Semi-seater', comfort: 'AC', rating: '4.5', seats: 17 },
            { name: 'Roadstar Coaches', time: '14:30', arrival: '21:15', duration: '6h 45m', price: 460, seatType: 'Seater', comfort: 'Non-AC', rating: '4.3', seats: 9 },
            { name: 'Night Owl Travels', time: '20:40', arrival: '04:25', duration: '7h 45m', price: 920, seatType: 'Sleeper', comfort: 'AC', rating: '4.8', seats: 13 }
        ],
        Train: [
            { name: 'Intercity Express', time: '04:50', arrival: '11:10', duration: '6h 20m', price: 620, seatType: 'Seater', comfort: 'Non-AC', rating: '4.4', seats: 18 },
            { name: 'Deccan Superfast', time: '09:15', arrival: '15:05', duration: '5h 50m', price: 980, seatType: 'Seater', comfort: 'AC', rating: '4.7', seats: 12 },
            { name: 'Coastal Dayliner', time: '15:40', arrival: '22:30', duration: '6h 50m', price: 740, seatType: 'Semi-seater', comfort: 'AC', rating: '4.5', seats: 16 },
            { name: 'Midnight Mail', time: '21:20', arrival: '05:55', duration: '8h 35m', price: 850, seatType: 'Sleeper', comfort: 'Non-AC', rating: '4.6', seats: 14 }
        ]
    };
    const tripImages = {
        Bus: [
            'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=480&q=80',
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=480&q=80'
        ],
        Train: [
            'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=480&q=80',
            'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=480&q=80'
        ]
    };

    function showMessage(text, type) {
        searchMessage.textContent = text;
        searchMessage.className = `alert alert-${type} mt-4`;
        searchMessage.classList.remove('d-none');
    }

    function getFilters() {
        return {
            time: document.querySelector('input[name="timeSlot"]:checked').value,
            seats: [...document.querySelectorAll('input[name="seatType"]:checked')].map(input => input.value),
            comfort: [...document.querySelectorAll('input[name="comfort"]:checked')].map(input => input.value)
        };
    }

    function timeMatches(time, slot) {
        if (slot === 'all') return true;
        const hour = Number(time.split(':')[0]);
        if (slot === 'morning') return hour < 6;
        if (slot === 'day') return hour >= 6 && hour < 12;
        if (slot === 'afternoon') return hour >= 12 && hour <= 23;
        return false;
    }

    function formatTime(time) {
        const [hour, minute] = time.split(':').map(Number);
        const suffix = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
    }

    function formatDate(date) {
        return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
    }

    function searchTrips() {
        const filters = getFilters();
        const from = document.getElementById('departure').value;
        const to = document.getElementById('arrival').value;
        const vehicle = document.getElementById('vehicleType').value;
        const tripOptions = sampleTrips[vehicle].filter(option =>
            timeMatches(option.time, filters.time) &&
            (!filters.seats.length || filters.seats.includes(option.seatType)) &&
            (!filters.comfort.length || filters.comfort.includes(option.comfort))
        );

        document.getElementById('resultsTitle').textContent = `${from} to ${to}`;
        const vehicleLabel = vehicle === 'Bus' ? (tripOptions.length === 1 ? 'bus' : 'buses') : (tripOptions.length === 1 ? 'train' : 'trains');
        resultCount.textContent = `${tripOptions.length} ${vehicleLabel} found`;
        resultsContainer.replaceChildren();
        seatSection.classList.add('d-none');
        ticketSection.classList.add('d-none');
        state.selectedTrip = null;
        state.selectedSeats.clear();

        if (!tripOptions.length) {
            resultsContainer.innerHTML = '<div class="empty-results">No trips match those filters. Try another time or seat type.</div>';
        } else {
            tripOptions.forEach((option, index) => {
                const card = document.createElement('article');
                card.className = 'trip-card';
                const imageUrl = tripImages[vehicle][index % tripImages[vehicle].length];
                card.innerHTML = `
                    <div class="trip-photo ${vehicle === 'Bus' ? 'trip-photo-bus' : 'trip-photo-train'}">
                        <img src="${imageUrl}"
                            alt="${vehicle === 'Bus' ? 'Luxury coach on a scenic journey' : 'Train crossing a scenic landscape'}"
                            loading="lazy">
                    </div>
                    <div>
                        <p class="trip-name">${option.name}</p>
                        <span class="trip-meta">${vehicle} · ★ ${option.rating} · ${option.seats} seats left</span>
                        <div class="trip-tags"><span class="trip-tag">${option.comfort}</span><span class="trip-tag">${option.seatType}</span></div>
                    </div>
                    <div>
                        <div class="trip-time"><span>${formatTime(option.time)}</span><span class="route-line"></span><span>${formatTime(option.arrival)}</span></div>
                        <span class="trip-time-label">${option.duration} · ${from} to ${to}</span>
                    </div>
                    <div><span class="trip-meta">Starting at</span><div class="trip-price">₹${option.price}</div></div>
                    <div class="trip-cta"><button class="btn btn-outline-primary btn-sm" type="button" data-trip-index="${index}">Select seats</button></div>`;
                card.querySelector('button').addEventListener('click', () => openSeatSelection(option));
                resultsContainer.appendChild(card);
            });
        }
        resultsSection.classList.remove('d-none');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        searchMessage.classList.add('d-none');
        if (!searchForm.reportValidity()) return;
        if (document.getElementById('departure').value === document.getElementById('arrival').value) {
            showMessage('Choose two different cities for your journey.', 'warning');
            return;
        }
        state.trip = {
            from: document.getElementById('departure').value,
            to: document.getElementById('arrival').value,
            date: travelDate.value,
            vehicle: document.getElementById('vehicleType').value,
            filters: getFilters()
        };
        sessionStorage.setItem('wayfarer.booking', JSON.stringify({ trip: state.trip }));
        searchButton.disabled = true;
        searchSpinner.classList.remove('d-none');
        loader.classList.remove('d-none');
        window.setTimeout(() => {
            loader.classList.add('d-none');
            searchButton.disabled = false;
            searchSpinner.classList.add('d-none');
            searchTrips();
        }, 1250);
    });

    function populateStops(from, to) {
        const boarding = document.getElementById('boardingPoint');
        const dropping = document.getElementById('droppingPoint');
        boarding.replaceChildren();
        dropping.replaceChildren();
        [`${from} Central Station`, `${from} City Centre`, `${from} Airport Road`].forEach((place, index) => {
            boarding.add(new Option(place, place, index === 0, index === 0));
        });
        [`${to} Central Station`, `${to} City Centre`, `${to} Airport Road`].forEach((place, index) => {
            dropping.add(new Option(place, place, index === 0, index === 0));
        });
    }

    function openSeatSelection(option) {
        state.selectedTrip = option;
        state.selectedSeats = new Set();
        document.getElementById('seatHeading').textContent = `Choose seats · ${option.name}`;
        populateStops(state.trip.from, state.trip.to);
        renderSeats(option.seats);
        updateSeatSummary();
        ticketSection.classList.add('d-none');
        seatSection.classList.remove('d-none');
        seatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderSeats(availableCount) {
        const grid = document.getElementById('seatGrid');
        grid.replaceChildren();
        const seatNumbers = Array.from({ length: 20 }, (_, index) => `S${index + 1}`);
        const unavailable = new Set(seatNumbers.filter((_, index) => (index * 7 + availableCount) % 11 === 0));
        const availableSeats = seatNumbers.filter(seat => !unavailable.has(seat)).slice(0, availableCount);
        seatNumbers.forEach((seat, index) => {
            if (index === 4) {
                const driver = document.createElement('span');
                driver.className = 'seat-driver';
                driver.textContent = 'FRONT';
                grid.appendChild(driver);
            }
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'seat';
            button.textContent = seat;
            button.setAttribute('aria-label', `${seat}${availableSeats.includes(seat) ? ', available' : ', unavailable'}`);
            if (!availableSeats.includes(seat)) {
                button.disabled = true;
            } else {
                button.addEventListener('click', () => {
                    if (state.selectedSeats.has(seat)) {
                        state.selectedSeats.delete(seat);
                        button.classList.remove('selected');
                        button.setAttribute('aria-pressed', 'false');
                    } else {
                        state.selectedSeats.add(seat);
                        button.classList.add('selected');
                        button.setAttribute('aria-pressed', 'true');
                    }
                    updateSeatSummary();
                    persistCurrentBooking();
                });
            }
            grid.appendChild(button);
        });
    }

    function updateSeatSummary() {
        const seats = [...state.selectedSeats].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
        document.getElementById('selectedSeatText').textContent = seats.length ? seats.join(', ') : 'Choose at least one seat';
        document.getElementById('seatTotal').textContent = `₹${seats.length * (state.selectedTrip?.price || 0)}`;
    }

    function persistCurrentBooking() {
        if (!state.trip || !state.selectedTrip) return;
        sessionStorage.setItem('wayfarer.booking', JSON.stringify({
            trip: state.trip,
            service: state.selectedTrip,
            seats: [...state.selectedSeats],
            boarding: document.getElementById('boardingPoint').value,
            dropping: document.getElementById('droppingPoint').value
        }));
    }

    document.getElementById('boardingPoint').addEventListener('change', persistCurrentBooking);
    document.getElementById('droppingPoint').addEventListener('change', persistCurrentBooking);

    document.getElementById('previewButton').addEventListener('click', () => {
        if (!state.selectedTrip || !state.selectedSeats.size) {
            showMessage('Select at least one available seat before reviewing your ticket.', 'warning');
            return;
        }
        const seats = [...state.selectedSeats].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
        state.booking = {
            ...state.trip,
            service: state.selectedTrip,
            seats,
            boarding: document.getElementById('boardingPoint').value,
            dropping: document.getElementById('droppingPoint').value,
            total: seats.length * state.selectedTrip.price,
            reference: `WF${Date.now().toString().slice(-8)}`
        };
        persistCurrentBooking();
        renderTicket(state.booking);
        ticketSection.classList.remove('d-none');
        ticketSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function renderTicket(booking) {
        document.getElementById('ticketPreview').innerHTML = `
            <div class="ticket-route">
                <div class="ticket-city">${booking.from}<small>${formatTime(booking.service.time)}</small></div>
                <div class="ticket-route-line"><span>→</span></div>
                <div class="ticket-city">${booking.to}<small>${formatTime(booking.service.arrival)}</small></div>
            </div>
            <div class="ticket-details">
                <div><span class="ticket-detail-label">Passenger</span><span class="ticket-detail-value">${escapeHtml(JSON.parse(sessionStorage.getItem('wayfarer.user')).username)}</span></div>
                <div><span class="ticket-detail-label">Journey date</span><span class="ticket-detail-value">${formatDate(booking.date)}</span></div>
                <div><span class="ticket-detail-label">Service & seats</span><span class="ticket-detail-value">${booking.service.name} · ${booking.seats.join(', ')}</span></div>
                <div><span class="ticket-detail-label">Total fare</span><span class="ticket-detail-value">₹${booking.total}</span></div>
                <div><span class="ticket-detail-label">Boarding</span><span class="ticket-detail-value">${booking.boarding}</span></div>
                <div><span class="ticket-detail-label">Dropping</span><span class="ticket-detail-value">${booking.dropping}</span></div>
                <div><span class="ticket-detail-label">Vehicle</span><span class="ticket-detail-value">${booking.vehicle} · ${booking.service.comfort} ${booking.service.seatType}</span></div>
                <div><span class="ticket-detail-label">Booking reference</span><span class="ticket-detail-value">${booking.reference}</span></div>
            </div>`;

        const qr = document.getElementById('paymentQr');
        const qrStatus = document.getElementById('qrStatus');
        qr.removeAttribute('src');
        qrStatus.textContent = 'Generating…';
        fetch(apiUrl('/api/qr'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: `DEMO BOOKING ${booking.reference} | INR ${booking.total}` })
        })
            .then(async response => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'QR code generation failed.');
                qr.src = result.image;
                qrStatus.textContent = 'DEMO QR';
            })
            .catch(error => {
                qr.alt = error.message;
                qrStatus.textContent = 'QR unavailable';
                console.error(error);
            });
    }

    function escapeHtml(value) {
        const element = document.createElement('span');
        element.textContent = value;
        return element.innerHTML;
    }

    document.getElementById('payButton').addEventListener('click', () => {
        if (!state.booking) return;
        const paymentMessage = document.getElementById('paymentMessage');
        paymentMessage.textContent = `Demo booking ${state.booking.reference} confirmed. No real payment was made.`;
        paymentMessage.classList.remove('d-none');
        sessionStorage.setItem('wayfarer.booking', JSON.stringify({ ...state.booking, status: 'demo-confirmed' }));
        document.querySelector('.ticket-status').textContent = 'DEMO CONFIRMED';
        document.querySelector('.ticket-status').classList.add('confirmed');
        document.getElementById('payButton').disabled = true;
    });

    document.getElementById('downloadButton').addEventListener('click', () => window.print());
    document.getElementById('newSearchButton').addEventListener('click', () => {
        ticketSection.classList.add('d-none');
        seatSection.classList.add('d-none');
        resultsSection.classList.add('d-none');
        searchForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
