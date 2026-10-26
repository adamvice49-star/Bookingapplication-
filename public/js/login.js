document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (!form) return;

    const usernameInput = document.getElementById('username');
    const mobileInput = document.getElementById('mobile');
    const otpInput = document.getElementById('otp');
    const otpSection = document.getElementById('otpSection');
    const demoOtp = document.getElementById('demoOtp');
    const message = document.getElementById('loginMessage');
    const button = document.getElementById('loginButton');
    const buttonLabel = button.querySelector('.button-label');
    const spinner = button.querySelector('.spinner-border');
    let generatedOtp = '';

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `alert alert-${type}`;
        message.classList.remove('d-none');
    }

    function setLoading(loading, label) {
        button.disabled = loading;
        buttonLabel.textContent = label;
        spinner.classList.toggle('d-none', !loading);
    }

    const apiUrl = path => `${window.WAYFARER_API_BASE || ''}${path}`;

    async function readApiResponse(response) {
        const body = await response.text();
        let result;
        try {
            result = body ? JSON.parse(body) : {};
        } catch {
            throw new Error(response.ok
                ? 'The server returned an unreadable response. Please try again.'
                : `The server could not complete the request (HTTP ${response.status}). Please try again.`);
        }
        if (!response.ok) {
            throw new Error(result.error || `Request failed (HTTP ${response.status}). Please try again.`);
        }
        return result;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        message.classList.add('d-none');

        if (!generatedOtp) {
            if (!form.reportValidity()) return;
            const username = usernameInput.value.trim();
            const mobile = mobileInput.value.trim();
            if (username.length < 3) {
                showMessage('Please enter a name with at least 3 characters.', 'danger');
                return;
            }
            if (!/^\d{10}$/.test(mobile)) {
                showMessage('Please enter a valid 10-digit mobile number.', 'danger');
                return;
            }

            setLoading(true, 'Creating code…');
            try {
                const response = await fetch(apiUrl('/api/login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, mobile })
                });
                const result = await readApiResponse(response);
                if (!/^\d{6}$/.test(String(result.otp || ''))) {
                    throw new Error('The server did not return a valid one-time code. Please try again.');
                }
                generatedOtp = String(result.otp);
                usernameInput.readOnly = true;
                mobileInput.readOnly = true;
                otpInput.required = true;
                otpSection.classList.remove('d-none');
                demoOtp.textContent = `Your demo code is ${result.otp}`;
                demoOtp.classList.remove('d-none');
                showMessage('Your one-time code is ready. Enter it below to continue.', 'success');
                setLoading(false, 'Verify & continue');
                otpInput.focus();
            } catch (error) {
                showMessage(error.message, 'danger');
                setLoading(false, 'Get one-time code');
            }
            return;
        }

        if (!/^\d{6}$/.test(otpInput.value.trim())) {
            showMessage('Enter the 6-digit one-time code shown above.', 'danger');
            return;
        }

        if (otpInput.value.trim() !== generatedOtp) {
            showMessage('Invalid OTP.', 'danger');
            return;
        }

        sessionStorage.setItem('wayfarer.user', JSON.stringify({
            username: usernameInput.value.trim(),
            mobile: mobileInput.value.trim()
        }));
        showMessage('Login successful! Taking you to your trips…', 'success');
        buttonLabel.textContent = 'You’re all set';
        window.setTimeout(() => window.location.replace('index.html'), 700);
    });
});
