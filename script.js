document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('cookieInput');
    const output = document.querySelector('#outputDict');
    var notificationBanner = document.getElementById('notificationBanner');

    // Function to copy text to clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show copied text notification
            notificationBanner.style.display = 'block';
            // Hide notification after 2 seconds
            setTimeout(() => {
                notificationBanner.style.display = 'none';
            }, 2000);
        }, (err) => {
            console.error('Async: Could not copy text: ', err);
        });
    }

    // Double click to copy output
    output.addEventListener('dblclick', () => {
        const jsonText = reconstructJSON(output);
        copyToClipboard(jsonText);
    });


    // Save and load the last input
    window.addEventListener('load', () => {
        const lastInput = localStorage.getItem('lastInput');
        if (lastInput) {
            input.value = lastInput;
            const cookies = parseCookies(lastInput);
            output.textContent = JSON.stringify(cookies, null, 2);
            applySyntaxHighlighting(output);
        }
    });

    input.addEventListener('input', () => {
        const cookies = parseCookies(input.value);
        output.textContent = JSON.stringify(cookies, null, 2);
        applySyntaxHighlighting(output);
        localStorage.setItem('lastInput', input.value);
    });

});

function reconstructJSON(element) {
    let reconstructedJSON = {};
    let lines = element.textContent.split('\n');

    lines.forEach(line => {
        // Extract key and value using regex
        let match = line.match(/(\w+): ("[^"]*"|\d+|true|false|null)/);
        if (match) {
            let key = match[1];
            let value = match[2];

            try {
                // Parse value if it's a string, boolean, number, or null
                reconstructedJSON[key] = JSON.parse(value);
            } catch (e) {
                // Keep raw value if parsing fails
                reconstructedJSON[key] = value;
            }
        }
    });

    return JSON.stringify(reconstructedJSON, null, 2);
}


function parseCookies(cookieString) {
    let cookies = {};

    // Detect if input is a cURL command and extract the cookie string
    const curlMatch = cookieString.match(/-H\s*'cookie:\s*([^']+)'/i) || cookieString.match(/-H\s*"cookie:\s*([^"]+)"/i);
    if (curlMatch && curlMatch[1]) {
        cookieString = curlMatch[1]; // Extract cookies from cURL command
    }

    // Split the cookie string and decode each cookie
    cookieString.split(';').forEach(pair => {
        const equalIndex = pair.indexOf('=');
        if (equalIndex > -1) {
            let key = pair.substring(0, equalIndex).trim();
            let value = pair.substring(equalIndex + 1).trim();
            if (key) {
                key = decodeURIComponent(key);
                value = decodeURIComponent(value);
                cookies[key] = value;
            }
        }
    });

    return cookies;
}

function applySyntaxHighlighting(element) {
    let text = element.textContent;

    // First, replace the brackets
    text = text.replace(/(\{|\}|\[|\])/g, `<span class="bracket">$&</span>`);

    // Next, replace the keys
    text = text.replace(/"([^"]+)":/g, `<span class="key">$1</span>:`);

    // Finally, replace the string values
    text = text.replace(/: ("[^"]*")/g, `: <span class="value">$1</span>`);

    element.innerHTML = text;
}

