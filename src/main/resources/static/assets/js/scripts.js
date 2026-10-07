/*!
* Start Bootstrap - Personal v1.0.1 (https://startbootstrap.com/template-overviews/personal)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-personal/blob/master/LICENSE)
*/
// This file is intentionally blank
// Use this file to add JavaScript to your project
const navigationHint = document.getElementById("navigation-hint");
const navbarToggler = document.querySelector(".navbar-toggler");

if (navigationHint && navbarToggler) {

    // Show automatically when the page loads
    navigationHint.classList.add("show");

    setTimeout(() => {
        navigationHint.classList.remove("show");
    }, 5000);

    // Show when hovering over the hamburger
    navbarToggler.addEventListener("mouseenter", () => {
        navigationHint.classList.add("show");
    });

    // Hide when leaving the hamburger
    navbarToggler.addEventListener("mouseleave", () => {
        navigationHint.classList.remove("show");
    });
}