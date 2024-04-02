// Function to show loading screen
function showLoadingScreen() {
    document.getElementById("loadingScreen").style.display = "block";

    // Add event listener for Escape key
    document.addEventListener('keyup', handleEscapeKey);
}

// Function to hide loading screen
function hideLoadingScreen() {
    document.getElementById("loadingScreen").style.display = "none";

    // Remove event listener for Escape key
    document.removeEventListener('keyup', handleEscapeKey);
}

// Function to handle Escape key press
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        hideLoadingScreen();
    }
}