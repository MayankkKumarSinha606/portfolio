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

/* Phishing project screenshot gallery */
document.addEventListener("DOMContentLoaded", () => {
    const galleryElement =
        document.getElementById("phishingGalleryModal");

    const imageModalElement =
        document.getElementById("phishingImageModal");

    const fullImage =
        document.getElementById("phishingFullImage");

    const imageTitle =
        document.getElementById("phishingImageTitle");

    if (!galleryElement || !imageModalElement ||
        !fullImage || !imageTitle) {
        return;
    }

    const galleryModal =
        bootstrap.Modal.getOrCreateInstance(galleryElement);

    const imageModal =
        bootstrap.Modal.getOrCreateInstance(imageModalElement);

    let returnToGallery = false;

    document.querySelectorAll(".screenshot-card").forEach(card => {
        card.addEventListener("click", () => {
            fullImage.src = card.dataset.fullImage;
            imageTitle.textContent = card.dataset.imageTitle;
            returnToGallery = true;

            galleryElement.addEventListener(
                "hidden.bs.modal",
                function openImage() {
                    galleryElement.removeEventListener(
                        "hidden.bs.modal", openImage
                    );
                    imageModal.show();
                }
            );

            galleryModal.hide();
        });
    });

    imageModalElement.addEventListener("hidden.bs.modal", () => {
        fullImage.src = "";

        if (returnToGallery) {
            returnToGallery = false;
            galleryModal.show();
        }
    });
});

// Infinite City screenshot gallery and full-size viewer
document.addEventListener("DOMContentLoaded", () => {
    const galleryElement =
        document.getElementById("infiniteCityGalleryModal");

    const imageModalElement =
        document.getElementById("infiniteCityImageModal");

    const fullImage =
        document.getElementById("infiniteCityFullImage");

    const imageTitle =
        document.getElementById("infiniteCityImageTitle");

    if (!galleryElement || !imageModalElement || !fullImage || !imageTitle) {
        return;
    }

    const galleryModal =
        bootstrap.Modal.getOrCreateInstance(galleryElement);

    const imageModal =
        bootstrap.Modal.getOrCreateInstance(imageModalElement);

    let shouldReturnToGallery = false;
    let selectedImage = null;

    galleryElement.querySelectorAll(".screenshot-card").forEach((card) => {
        card.addEventListener("click", () => {
            selectedImage = {
                src: card.dataset.fullImage,
                title: card.dataset.imageTitle || "Screenshot"
            };

            if (!selectedImage.src) return;

            fullImage.src = selectedImage.src;
            fullImage.alt = selectedImage.title;
            imageTitle.textContent = selectedImage.title;

            shouldReturnToGallery = true;

            galleryElement.addEventListener(
                "hidden.bs.modal",
                function openFullImage() {
                    galleryElement.removeEventListener(
                        "hidden.bs.modal",
                        openFullImage
                    );

                    imageModal.show();
                },
                { once: true }
            );

            galleryModal.hide();
        });
    });

    imageModalElement.addEventListener("hidden.bs.modal", () => {
        fullImage.src = "";

        if (shouldReturnToGallery) {
            shouldReturnToGallery = false;
            galleryModal.show();
        }
    });
});

/* Airline Reservation System screenshot gallery and full-size viewer */
document.addEventListener("DOMContentLoaded", () => {
    const galleryElement =
        document.getElementById("airlineGalleryModal");

    const imageModalElement =
        document.getElementById("airlineImageModal");

    const fullImage =
        document.getElementById("airlineFullImage");

    const imageTitle =
        document.getElementById("airlineImageTitle");

    if (!galleryElement || !imageModalElement || !fullImage || !imageTitle) {
        return;
    }

    const galleryModal =
        bootstrap.Modal.getOrCreateInstance(galleryElement);

    const imageModal =
        bootstrap.Modal.getOrCreateInstance(imageModalElement);

    let shouldReturnToGallery = false;

    galleryElement.querySelectorAll(".screenshot-card").forEach((card) => {
        card.addEventListener("click", () => {
            const imageSrc = card.dataset.fullImage;
            const title = card.dataset.imageTitle || "Screenshot";

            if (!imageSrc) return;

            fullImage.src = imageSrc;
            fullImage.alt = title;
            imageTitle.textContent = title;

            shouldReturnToGallery = true;

            galleryElement.addEventListener(
                "hidden.bs.modal",
                function openFullImage() {
                    imageModal.show();
                },
                { once: true }
            );

            galleryModal.hide();
        });
    });

    imageModalElement.addEventListener("hidden.bs.modal", () => {
        fullImage.src = "";

        if (shouldReturnToGallery) {
            shouldReturnToGallery = false;
            galleryModal.show();
        }
    });
});


/* Existing contact form: optional WhatsApp click-to-chat */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    const checkbox = document.getElementById("sendOnWhatsApp");

    if (!form || !checkbox) return;

    form.addEventListener("submit", (event) => {
        if (!checkbox.checked) return;

        const number = (form.dataset.whatsappNumber || "").trim();

        if (!number) {
            event.preventDefault();
            alert("WhatsApp is not configured yet. Please try again later.");
            return;
        }

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const message = document.getElementById("message").value.trim();

        const text =
            `Hi Mayank,\n\n` +
            `I'd like to connect with you through your portfolio.\n\n` +
            `Name: ${name}\n` +
            `Email: ${email}\n` +
            `Phone: ${phone}\n\n` +
            `Message:\n${message}`;

        const url =
            `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

        // Open immediately from the submit interaction to reduce
        // the chance of the browser blocking the new tab.
        window.open(url, "_blank");
    });
});

